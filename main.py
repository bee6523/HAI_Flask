import argparse
import base64
import numpy as np
import cv2

from flask import Flask, render_template, request
from engine import inpaint, controlled_inpaint

parser = argparse.ArgumentParser()
parser.add_argument('--port', default=5000, type=int, help='port number')
parser.add_argument('--local', action='store_true', help='run in local')
#parser.add_argument('--use_gpus', action='store_true', help='use gpus')
 
app = Flask(__name__)
 
@app.route('/')
def index():
    return render_template("index.html")
 
@app.route('/pages/Upload.html')
def Upload():
    return render_template("pages/Upload.html")

@app.route('/pages/Step2Components.html')
def Step2Comp():
    return render_template("/pages/Step2Components.html")

@app.route('/pages/Step3Components.html')
def Step3Comp():
    return render_template("/pages/Step3Components.html")

def example_function():
    img_path="./engine/input_image.png"
    mask_path="./engine/input_mask.png"

    ret_path = "./engine/model_output_image.png"
    ret_att_path = "./engine/input_att.png"

    output, att = inpaint(image_path=img_path,
                          mask_path=mask_path,
                          out_image_path=ret_path,
                          out_att_path=ret_att_path)
    # no need to write output, inpaint already does this
    return ret_path, ret_att_path

@app.route('/Result', methods=['POST'])
def showAttendResult():
    #base64 image string?
    img_file=request.form['img']
    mask_file=request.form['mask']
    att_file=request.form['att']

    image_arr=np.frombuffer(base64.b64decode(img_file.split(',')[1]),dtype=np.uint8)
    image=cv2.imdecode(image_arr,flags=cv2.IMREAD_COLOR)
    mask_arr=np.frombuffer(base64.b64decode(mask_file.split(',')[1]),dtype=np.uint8)
    mask=cv2.imdecode(mask_arr,flags=cv2.IMREAD_COLOR)
    att_arr=np.frombuffer(base64.b64decode(att_file.split(',')[1]),dtype=np.uint8)
    att=cv2.imdecode(att_arr,flags=cv2.IMREAD_COLOR)

    img_path="./engine/input_image.png"
    mask_path="./engine/input_mask.png"
    att_path="./engine/input_att.png"
    ret_path="./static/img/ret.png"
    cv2.imwrite(img_path,image)
    cv2.imwrite(mask_path,mask)
    cv2.imwrite(att_path,att)
    
    output = controlled_inpaint(image_path=img_path,
                                mask_path=mask_path,
                                att_path=att_path,
                                out_image_path=ret_path)
    # no need to write output, controlled_inpaint already does this
    # cv2.imwrite(ret_path,output)

    return ret_path

if __name__ =='__main__':
    args = parser.parse_args()
    if args.local:
        # localhost
        app.run(port=args.port)
    else:
        # deploy
        app.run(host='0.0.0.0', port=args.port)
