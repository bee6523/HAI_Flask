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
    assert flow.shape == cmap.shape
    h, w, _ = flow.shape
    # for each flow pixel, find nearest neighbor position in cmap
    flow_tiled = np.tile(np.reshape(flow, [h, w, 1, 1, 3]), [1, 1, h, w, 1]) / 255
    cmap_tiled = np.tile(np.reshape(cmap, [1, 1, h, w, 3]), [h, w, 1, 1, 1]) / 255
    dist = ((cmap_tiled - flow_tiled) ** 2).sum(-1)
    dist = np.reshape(dist, [h * w, h * w])
    idx = np.argmax(-dist, axis=-1)
    
    # convert to one-hot attention
    att_values = np.zeros((h * w, h * w)).astype(np.float32)
    att_values[np.arange(h * w), idx] = 1.
    att_values = np.reshape(att_values, [h, w, h * w])

    return att_values
