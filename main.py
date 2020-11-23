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
    print(request.data)
    img_file=request.json['image']
    mask_file=request.json['mask']
    att_file=request.json['att']
    print("img_loaded")
    output = controlled_inpaint(image_path=img_file,
                            mask_path=mask_file,
                            att_path=att_file,
                            out_image_path='./output_controlled.png')
    return render_template("pages/Upload.html")

if __name__ =='__main__':
    app.run()