from flask import Flask, render_template, request
 
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

if __name__ =='__main__':
    app.run()