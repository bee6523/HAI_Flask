from flask import Flask, render_template, request
from engine import controlled_inpaint
 
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

@app.route('/Result', methods=['POST'])
def showAttendResult():
    img_file=request.files['image']
    mask_file=request.files['mask']
    att_file=request.files['att']
    output = controlled_inpaint(image_path='deepfillv1/examples/places2/sunset_input.png',
                            mask_path='deepfillv1/examples/places2/sunset_mask.png',
                            att_path='./output_att.png',
                            out_image_path='./output_controlled.png')
    return render_template("pages/Upload.html")

if __name__ =='__main__':
    # app.run() # localhost
    app.run(host='0.0.0.0', port='8888') # to run in a docker container
