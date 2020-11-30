import argparse
import base64
import numpy as np
import cv2
import time

from flask import Flask, session, render_template, request
from engine import inpaint, controlled_inpaint

parser = argparse.ArgumentParser()
parser.add_argument('--port', default=5000, type=int, help='port number')
parser.add_argument('--local', action='store_true', help='run in local')
#parser.add_argument('--use_gpus', action='store_true', help='use gpus')
 
app = Flask(__name__)
app.secret_key=b'\n\xed\xcayP3}\xf7\x8fb\xc5\x05\x9d\x12g\xfaB\xa7\x94\xba\x1c\xa4\xf9\xdd'
 
@app.route('/')
def index():
    if 'username' in session:
        print("session set")
        print(session['username'])
        pass
    else:
        session['username']= str(int(time.time()*1000)) # username은 밀리초 단위의 시간
        print("session set :")
        print(session['username'])
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

@app.route('/pages/Step4Components.html')
def Step4Comp():
    return render_template("/pages/Step4Components.html")

@app.route('/InitResult', methods=['POST'])
def example_function():
    img_file=request.form['img']
    mask_file=request.form['mask']

    image_arr=np.frombuffer(base64.b64decode(img_file.split(',')[1]),dtype=np.uint8)
    image=cv2.imdecode(image_arr,flags=cv2.IMREAD_COLOR)
    mask_arr=np.frombuffer(base64.b64decode(mask_file.split(',')[1]),dtype=np.uint8)
    mask=cv2.imdecode(mask_arr,flags=cv2.IMREAD_COLOR)

    img_path="./static/tmp/input_image"+session['username']+".png"
    mask_path="./static/tmp/input_mask"+session['username']+".png"

    ret_path = "./static/tmp/model_output_image"+session['username']+".png"
    ret_att_path = "./static/tmp/input_att"+session['username']+".png"

    cv2.imwrite(img_path,image)
    cv2.imwrite(mask_path,mask)
    
    cache = "./static/tmp/cache"+session['username']+".npy"

    inpaint(image_path=img_path,
            mask_path=mask_path,
            out_image_path=ret_path,
            out_att_path=ret_att_path,
            out_cache_path=cache)
    # no need to write output, inpaint already does this
    return ret_path+"&"+ret_att_path

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

    img_path="./static/tmp/input_image"+session['username']+".png"
    mask_path="./static/tmp/input_mask"+session['username']+".png"
    att_path="./static/tmp/input_att"+session['username']+".png"
    ret_path="./static/tmp/model_output_image"+session['username']+".png"
    cv2.imwrite(img_path,image)
    cv2.imwrite(mask_path,mask)
    cv2.imwrite(att_path,att)
    
    cache = "./static/tmp/cache"+session['username']+".npy"
    ref_att_path = "./static/tmp/input_att"+session['username']+".png"
    
    controlled_inpaint(image_path=img_path,
                       mask_path=mask_path,
                       att_path=att_path,
                       cache_path=cache,
                       ref_att_path=ref_att_path,
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
