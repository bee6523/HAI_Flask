import os
from matplotlib import pyplot as plt
import cv2
import numpy as np
import tensorflow as tf
#tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)  # will suppress all warnings
import neuralgym as ng
from .deepfillv1.inpaint_model import InpaintCAModel
from .deepfillv1.inpaint_ops import flow_to_image_tf
from .utils import Namespace, get_colormap_image, reverse_map


#ng.get_gpus(1)
GRID = 8


def get_ref_colormap(width, height, out_path='colorpalette.jpg'):
    """
    Make and save a reference colormap of width x height size
    """
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        colormap = get_colormap_image(width, height, width, height)
        colormap = (colormap + 1.) * 127.5
        colormap = tf.reverse(colormap, [-1])
        colormap = tf.saturate_cast(colormap, tf.uint8)
        colormap = sess.run(colormap)
        colormap = np.array(colormap)[0][:, :, ::-1]
        cv2.imwrite(out_path, colormap)
    return colormap


def inpaint(image_path, mask_path, out_image_path, out_att_path,
            out_cache_path, checkpoint_dir='./engine/deepfillv1/model_logs'):
    tf.reset_default_graph()
    model = InpaintCAModel()
    image = cv2.imread(image_path)
    mask = cv2.imread(mask_path)
    h, w, _ = image.shape
    if not (h//GRID*GRID == h and w//GRID*GRID == w):
        print(f"WARNING: image not on grid: do something like image = image[:h//{GRID}*{GRID}, :w//{GRID}*{GRID}, :]")
        image = image[:h//GRID*GRID, :w//GRID*GRID, :]
        mask = mask[:h//GRID*GRID, :w//GRID*GRID, :]
        h, w, _ = image.shape
    assert image.shape == mask.shape
    print('Shape of image: {}'.format(image.shape))
    mask_ds = cv2.resize(mask, dsize=(w//GRID, h//GRID), interpolation=cv2.INTER_NEAREST)
    mask = cv2.resize(mask_ds, dsize=(w, h), interpolation=cv2.INTER_NEAREST)
    print('Shape of quantized mask: {}'.format(mask.shape))
    image = np.expand_dims(image, 0)
    mask = np.expand_dims(mask, 0)
    input_image = np.concatenate([image, mask], axis=2)
    print('Shape of model input: {}'.format(input_image.shape))
    
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        input_image = tf.constant(input_image, dtype=tf.float32)
        output, flow, attention = model.build_server_graph(input_image)
        def toimg(t):
            t = (t + 1.) * 127.5
            t = tf.reverse(t, [-1])
            t = tf.saturate_cast(t, tf.uint8)
            return t
        output = toimg(output)
        flow = toimg(flow)
        # load pretrained model
        vars_list = tf.get_collection(tf.GraphKeys.GLOBAL_VARIABLES)
        assign_ops = []
        for var in vars_list:
            vname = var.name
            from_name = vname
            var_value = tf.contrib.framework.load_variable(checkpoint_dir, from_name)
            assign_ops.append(tf.assign(var, var_value))
        sess.run(assign_ops)
        print('Model loaded.')
        result, flow, attention= sess.run(output), sess.run(flow), sess.run(attention)
        result = np.array(result)
        result, coarse, fine = np.split(result, 3, axis=2)
        print('Shape of model output: {}'.format(result.shape))
        flow = np.array(flow)
        flow = cv2.resize(flow[0][:, :, ::-1], dsize=(w, h), interpolation=cv2.INTER_NEAREST)
        print('Shape of model attention (colored): {}'.format(flow.shape))
        attention = np.array(attention)
        print('Shape of model attention (raw): {}'.format(attention.shape))
    
    out_image = result[0][:, :, ::-1]
    out_flow = flow
    cv2.imwrite(out_image_path, out_image)
    cv2.imwrite(out_att_path, flow)
    np.save(out_cache_path, attention)
    print('Done')
    return out_image, out_flow


def controlled_inpaint(image_path, mask_path, att_path,
                       cache_path, ref_att_path,
                       out_image_path, checkpoint_dir='./engine/deepfillv1/model_logs'):
    tf.reset_default_graph()
    model = InpaintCAModel()
    image = cv2.imread(image_path)
    mask = cv2.imread(mask_path)
    flow = cv2.imread(att_path)
    ref_flow = cv2.imread(ref_att_path)
    cached_attention = np.load(cache_path)
    h, w, _ = image.shape
    if not (h//GRID*GRID == h and w//GRID*GRID == w):
        print(f"WARNING: image not on grid: do something like image = image[:h//{GRID}*{GRID}, :w//{GRID}*{GRID}, :]")
        image = image[:h//GRID*GRID, :w//GRID*GRID, :]
        mask = mask[:h//GRID*GRID, :w//GRID*GRID, :]
        flow = flow[:h//GRID*GRID, :w//GRID*GRID, :]
        ref_flow = ref_flow[:h//GRID*GRID, :w//GRID*GRID, :]
        h, w, _ = image.shape
    assert image.shape == mask.shape == flow.shape
    print('Shape of image: {}'.format(image.shape))
    mask_ds = cv2.resize(mask, dsize=(w//GRID, h//GRID), interpolation=cv2.INTER_NEAREST)
    mask = cv2.resize(mask_ds, dsize=(w, h), interpolation=cv2.INTER_NEAREST)
    print('Shape of quantized mask: {}'.format(mask.shape))
    print('Shape of control flow: {}'.format(flow.shape))
    image = np.expand_dims(image, 0)
    mask = np.expand_dims(mask, 0)
    input_image = np.concatenate([image, mask], axis=2)
    print('Shape of model input: {}'.format(input_image.shape))
    mask_downsampled = cv2.resize(mask[0][..., -1], dsize=(w//GRID, h//GRID), interpolation=cv2.INTER_NEAREST)
    
    # process attention images
    input_flow = np.expand_dims(flow, 0)
    ref_input_flow = np.expand_dims(ref_flow, 0)
    flow_downsampled = cv2.resize(input_flow[0], dsize=(w//GRID, h//GRID), interpolation=cv2.INTER_NEAREST)
    ref_flow_downsampled = cv2.resize(ref_input_flow[0], dsize=(w//GRID, h//GRID), interpolation=cv2.INTER_NEAREST)
    unchanged = np.abs((flow_downsampled - ref_flow_downsampled).mean(-1)) < 1
    
    # get reference colormap
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        colormap = get_colormap_image(w//GRID, h//GRID, w//GRID, h//GRID)
        colormap = (colormap + 1.) * 127.5
        colormap = tf.reverse(colormap, [-1])
        colormap = tf.saturate_cast(colormap, tf.uint8)
        colormap = sess.run(colormap)
        colormap = np.array(colormap)
    
    # convert colormap to attention values
    input_att = np.expand_dims(reverse_map(flow_downsampled[:, :, ::-1], colormap[0]), 0)
    # for unchanged pixels, use original attention
    input_att[0, unchanged, :] = cached_attention[0, unchanged, :]
    
    print(f'Shape of att values: {input_att.shape}')
    
    input_image = np.ascontiguousarray(input_image)
    input_att = np.ascontiguousarray(input_att)
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        input_image = tf.constant(input_image, dtype=tf.float32)
        input_att = tf.constant(input_att, dtype=tf.float32)
        output, flow, attention = model.build_server_graph(input_image, input_att)
        def toimg(t):
            t = (t + 1.) * 127.5
            t = tf.reverse(t, [-1])
            t = tf.saturate_cast(t, tf.uint8)
            return t
        output = toimg(output)
        flow = toimg(flow)
        # load pretrained model
        vars_list = tf.get_collection(tf.GraphKeys.GLOBAL_VARIABLES)
        assign_ops = []
        for var in vars_list:
            vname = var.name
            from_name = vname
            var_value = tf.contrib.framework.load_variable(checkpoint_dir, from_name)
            assign_ops.append(tf.assign(var, var_value))
        sess.run(assign_ops)
        print('Model loaded.')
        result, flow = sess.run(output), sess.run(flow)
        result = np.array(result)
        result, coarse, fine = np.split(result, 3, axis=2)
        print('Shape of model output: {}'.format(result.shape))
        flow = np.array(flow)
        flow = cv2.resize(flow[0][:, :, ::-1], dsize=(w, h), interpolation=cv2.INTER_NEAREST)
        print('Shape of model attention (colored): {}'.format(flow.shape))
        
    out_image = result[0][:, :, ::-1]
    cv2.imwrite(out_image_path, out_image)
    print('Done')
    return out_image
