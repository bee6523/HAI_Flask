import numpy as np
import tensorflow as tf
#tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)  # will suppress all warnings
from .deepfillv1.inpaint_ops import flow_to_image_tf
from neuralgym.ops.layers import resize


class Namespace:
    # to use args in notebook
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


def get_colormap_image(w, h, w_final, h_final):
    h_add = tf.tile(tf.reshape(tf.range(h), [1, h, 1, 1]), [1, 1, w, 1])
    w_add = tf.tile(tf.reshape(tf.range(w), [1, 1, w, 1]), [1, h, 1, 1])
    pos = tf.concat([h_add, w_add], axis=3)

    h_ctr = tf.ones((1, h, w, 1), tf.int32) * tf.cast(h, tf.int32) // 2
    w_ctr = tf.ones((1, h, w, 1), tf.int32) * tf.cast(w, tf.int32) // 2
    ctr = tf.concat([h_ctr, w_ctr], axis=3)
    
    flow = flow_to_image_tf(pos - ctr)
    flow = resize(flow, scale=w_final//w, func=tf.image.resize_nearest_neighbor)
    return flow


def reverse_map(flow, cmap):
    # compute pseudoattention
    assert flow.shape == cmap.shape
    h, w, _ = flow.shape
    # for each flow pixel, find nearest neighbor position in cmap
    flow_tiled = np.tile(np.reshape(flow, [h, w, 1, 1, 3]), [1, 1, h, w, 1]) / 255
    cmap_tiled = np.tile(np.reshape(cmap, [1, 1, h, w, 3]), [h, w, 1, 1, 1]) / 255
    dist = ((cmap_tiled - flow_tiled) ** 2).sum(-1)
    dist = np.reshape(dist, [h * w, h * w])
    idx = np.argmax(-dist, axis=-1)
    
    # dist-map
    def idx2dist(height, width, indexes):
        hw = height * width
        assert hw == len(indexes)
        hvec, wvec = np.arange(height), np.arange(width)
        hmap = np.tile(np.reshape(hvec, [1, height, 1]), [hw, 1, width])  # [H * W, H, W]
        wmap = np.tile(np.reshape(wvec, [1, 1, width]), [hw, height, 1])  # [H * W, H, W]
        hmap = np.reshape(hmap, [hw, hw])  # [H * W, H * W]
        wmap = np.reshape(wmap, [hw, hw])  # [H * W, H * W]
        hdist = hmap - np.tile(np.expand_dims(hmap[np.arange(hw), indexes], -1), [1, hw])
        wdist = wmap - np.tile(np.expand_dims(wmap[np.arange(hw), indexes], -1), [1, hw])
        d2 = (hdist ** 2 + wdist ** 2).astype(np.float32)  # [H * W, H * W]
        return d2
    
    att_type = 'e'
    sig1 = 0.3
    sig2 = 0.02
    if att_type == 'e':  # Euclidean-Gaussian kernel
        att_values = np.exp(-idx2dist(h, w, idx) / sig1**2)
        # att_values /= (att_values.sum(-1) + 1e-3)
    elif att_type == 'c':  # color-Gaussian kernel
        att_values = np.exp(-dist / sig2**2)
        # att_values /= (att_values.sum(-1) + 1e-3)
    elif att_type == '1':  # one-hot attention
        att_values = np.zeros((h * w, h * w)).astype(np.float32)
        att_values[np.arange(h * w), idx] = 1.
    else:  # Busan-style attention
        alpha = 0.9
        att_values = alpha * np.exp(-idx2dist(h, w, idx) / sig1**2) + (1 - alpha) * np.exp(-dist / sig2**2)
        # att_values /= (att_values.sum(-1) + 1e-3)
    
    att_values = np.reshape(att_values, [h, w, h * w])
    return att_values
