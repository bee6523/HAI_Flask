import os

from matplotlib import pyplot as plt
import cv2

import numpy as np
import tensorflow as tf
#tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)  # will suppress all warnings

import neuralgym as ng
from deepfillv1.inpaint_model import InpaintCAModel
from deepfillv1.inpaint_ops import flow_to_image_tf
from utils import Namespace, get_colormap_image, reverse_map


#ng.get_gpus(1)


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


def inpaint(image_path, mask_path, out_image_path, out_att_path, checkpoint_dir='deepfillv1/model_logs'):
    tf.reset_default_graph()
    model = InpaintCAModel()
    image = cv2.imread(image_path)
    mask = cv2.imread(mask_path)
    assert image.shape == mask.shape
    h, w, _ = image.shape
    grid = 8
    
    image = image[:h//grid*grid, :w//grid*grid, :]
    mask = mask[:h//grid*grid, :w//grid*grid, :]
    print('Shape of image: {}'.format(image.shape))
    image = np.expand_dims(image, 0)
    mask = np.expand_dims(mask, 0)
    input_image = np.concatenate([image, mask], axis=2)
    print('Shape of model input: {}'.format(input_image.shape))
    
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        input_image = tf.constant(input_image, dtype=tf.float32)
        output, attention = model.build_server_graph(input_image)
        output = (output + 1.) * 127.5
        output = tf.reverse(output, [-1])
        output = tf.saturate_cast(output, tf.uint8)
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
        result = sess.run(output)
        print('Shape of model output: {}'.format(result.shape))
        result = np.array(result)
        result, coarse, fine, flow = np.split(result, 4, axis=2)
    
    out_image = result[0][:, :, ::-1]
    out_flow = flow[0][:, :, ::-1]
    cv2.imwrite(out_image_path, out_image)
    cv2.imwrite(out_att_path, out_flow)
    print('Done')
    return out_image, out_flow


def controlled_inpaint(image_path, mask_path, att_path, out_image_path, checkpoint_dir='deepfillv1/model_logs'):
    tf.reset_default_graph()
    model = InpaintCAModel()
    image = cv2.imread(image_path)
    mask = cv2.imread(mask_path)
    flow = cv2.imread(att_path)
    assert image.shape == mask.shape == flow.shape
    
    h, w, _ = image.shape
    grid = 8
    image = image[:h//grid*grid, :w//grid*grid, :]
    mask = mask[:h//grid*grid, :w//grid*grid, :]
    print('Shape of image: {}'.format(image.shape))
    image = np.expand_dims(image, 0)
    mask = np.expand_dims(mask, 0)
    input_image = np.concatenate([image, mask], axis=2)
    print('Shape of model input: {}'.format(input_image.shape))
    flow = flow[:h//grid*grid, :w//grid*grid, :]
    input_flow = np.expand_dims(flow, 0)
    print('Shape of att colormap input: {}'.format(input_flow.shape))
    
    dratio = 8
    dw, dh = w//dratio, h//dratio
    mask_downsampled = cv2.resize(mask[0][..., -1], dsize=(dw, dh), interpolation=cv2.INTER_NEAREST)
    flow_downsampled = cv2.resize(input_flow[0], dsize=(dw, dh), interpolation=cv2.INTER_NEAREST)
    
    # get reference colormap
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        colormap = get_colormap_image(dw, dh, dw, dh)
        colormap = (colormap + 1.) * 127.5
        colormap = tf.reverse(colormap, [-1])
        colormap = tf.saturate_cast(colormap, tf.uint8)
        colormap = sess.run(colormap)
        colormap = np.array(colormap)
    
    # convert colormap to attention values
    input_att = np.expand_dims(reverse_map(flow_downsampled[:, :, ::-1], colormap[0]), 0)
    print(f'Shape of att values: {input_att.shape}')
    
    input_image = np.ascontiguousarray(input_image)
    input_att = np.ascontiguousarray(input_att)
    sess_config = tf.ConfigProto()
    sess_config.gpu_options.allow_growth = True
    with tf.Session(config=sess_config) as sess:
        input_image = tf.constant(input_image, dtype=tf.float32)
        input_att = tf.constant(input_att, dtype=tf.float32)
        output, attention = model.build_server_graph(input_image, input_att)
        output = (output + 1.) * 127.5
        output = tf.reverse(output, [-1])
        output = tf.saturate_cast(output, tf.uint8)
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
        result = sess.run(output)
        attention = sess.run(attention)
        print('Shape of model output: {}'.format(result.shape))

        result = np.array(result)
        result, coarse, fine, flow = np.split(result, 4, axis=2)
    
    out_image = result[0][:, :, ::-1]
    cv2.imwrite(out_image_path, out_image)
    print('Done')
    return out_image
