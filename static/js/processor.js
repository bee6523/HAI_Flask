var image_file, iamge, colorMap,
  img_width,img_height,
  img_layer, img_ctx,
  cnv_layer, cnv_ctx,
  tmp_layer,tmp_ctx,
  prevX,prevY,
  currX,currY,
  attendX,attendY;
var mask, attention;
var tool="rect";
var lineWidth=5;
var draw_flag=false;

let processor = {
    doLoad: function() {
      img_layer = document.getElementById("img_layer");
      cnv_layer = document.getElementById("canvas_layer");
      tmp_layer=document.getElementById("tmp_layer");
      img_ctx = img_layer.getContext("2d");
      cnv_ctx = cnv_layer.getContext("2d");
      tmp_ctx=tmp_layer.getContext("2d");
      colorMap = new Image();
      colorMap.src="/static/img/colorpalette.png";
      this.elImage = document.getElementById("userUploadedImage");

      this.elImage.addEventListener("change", (evt)=>{
          image_file = evt.target.files[0];
          image = new Image();
          image.addEventListener("load",(evt)=>{
            ratio=image.height/image.width;
            if(ratio>(400/550)){
              img_width=parseInt(400/ratio);
              img_height=400;
            }else{
              img_width=550;
              img_height=parseInt(550*ratio);
            }
            img_layer.width=cnv_layer.width=tmp_layer.width=img_width;
            img_layer.height=cnv_layer.height=tmp_layer.height=img_height;
            img_ctx.drawImage(image,0,0,img_width,img_height);
          });
          image.src=window.URL.createObjectURL(image_file);
          $('#nextBtn').show();
      })
    },
  };

function startDrawing(){
  tmp_layer.addEventListener("mousemove",doDraw);
  tmp_layer.addEventListener("mousedown",initDraw);
  tmp_layer.addEventListener("mouseup",endDraw);
  tmp_layer.addEventListener("mouseout",endDraw);
}
function startAttending(){
  mask=convertToBinaryMap();
  tool="picker";
}

function downloadMasks(el){
  el.href=mask;
}
function downloadAttention(el){
  el.href=convertToAttImage();
}

// function showResult(){
//   attention=convertToAttImage();
//   function postData(input) {
//     $.ajax({
//         type: "POST",
//         url: "/reverse_pca.py",
//         data: { param: input },
//         success: callbackFunc
//     });
//   }
// }
function callbackFunc(response){
  console.log(response);
}

function convertToBinaryMap(){
  var canvas=document.createElement("canvas");
  var ctx=canvas.getContext("2d");
  canvas.width=img_width;
  canvas.height=img_height;
  ctx.fillStyle="black";
  ctx.fillRect(0,0,img_width,img_height);
  ctx.drawImage(cnv_layer,0,0);

  return canvas.toDataURL("image/png");
}
function convertToAttImage(){
  var canvas=document.createElement("canvas");
  var ctx=canvas.getContext("2d");
  canvas.width=img_width;
  canvas.height=img_height;

  ctx.drawImage(cnv_layer,0,0);

  return canvas.toDataURL("image/png");
}


function initDraw(e){
  if(tool=="fill"){
    drawAttention(e.layerX,e.layerY);
    return;
  }else{
    draw_flag=true;
    currX = e.layerX;
    currY = e.layerY;
    prevX=currX;
    prevY=currY;
  }
}
function doDraw(e){
  if(draw_flag){
    switch(tool){
      case "brush":
        prevX = currX;
        prevY = currY;
        currX = e.layerX;
        currY = e.layerY;
        drawLine();
        break;
      case "rect":
        tmp_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
        currX=e.layerX;
        currY=e.layerY;
        tmp_ctx.fillStyle="white"
        tmp_ctx.fillRect(prevX,prevY,currX-prevX,currY-prevY);
        break;
      case "picker":
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        currX=e.layerX;
        currY=e.layerY;
        tmp_ctx.beginPath();
        tmp_ctx.arc(currX,currY,10,0,Math.PI*2,false);
        tmp_ctx.arc(currX,currY,7,Math.PI*2,0,true);
        tmp_ctx.fillStyle="red";
        tmp_ctx.fill();
    }
  }
}
function endDraw(e){
  draw_flag=false;
  switch(tool){
    case "picker":
      attendX=currX;
      attendY=currY;
      break;
    case "fill":
      break;
    default:
      cnv_ctx.drawImage(tmp_layer,0,0);
      tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
  }
}
function drawLine() {
  tmp_ctx.beginPath();
  tmp_ctx.moveTo(prevX, prevY);
  tmp_ctx.lineTo(currX, currY);
  tmp_ctx.strokeStyle = "white";
  tmp_ctx.lineWidth = lineWidth;
  tmp_ctx.lineCap = "round";
  tmp_ctx.stroke();
  tmp_ctx.closePath();
}

function recrec() {
  tool="rect";
  document.getElementById("brushBtn").disabled=false;
  document.getElementById("rectBtn").disabled=true;  
}
function brusrush() {
  tool="brush";
  document.getElementById("rectBtn").disabled=false;
  document.getElementById("brushBtn").disabled=true;
}
function pickicker() {
  tool="picker";
  document.getElementById("pickerBtn").disabled=true;
  document.getElementById("fillBtn").disabled=false;
  document.getElementById("brushBtn").disabled=false;
}
function fillill() {
  console.log("!!");
  tool="fill";
  document.getElementById("pickerBtn").disabled=false;
  document.getElementById("fillBtn").disabled=true;
  document.getElementById("brushBtn").disabled=false;
}
function brushrush_3() {
  tool="brush_3";
  document.getElementById("pickerBtn").disabled=false;
  document.getElementById("fillBtn").disabled=false;
  document.getElementById("brushBtn").disabled=true;
}
function drawAttention(sx,sy){
  var hei_ratio=colorMap.height/img_height;
  var wid_ratio=colorMap.width/img_width;
  var lx,ly,rx,ry;
  const ctx=cnv_ctx;

  var imgData=ctx.getImageData(0,0,img_width,img_height);
  var data=imgData.data;
  if(data[computeIndex(sx,sy)+3]==0){ //if click point is not inpainting region
    return;
  }

  for(lx=sx;lx>=0;lx--){
    index=computeIndex(lx,sy,img_width);
    if(data[index+3]==0){
      break;
    }
  }
  lx++;
  for(ly=sy;ly>=0;ly--){
    index=computeIndex(lx,ly,img_width);
    if(data[index+3]==0)
      break;
  }
  ly++;
  for(rx=sx;rx<img_width;rx++){
    index=computeIndex(rx,sy,img_width);
    if(data[index+3]==0)
      break;
  }
  rx--;
  for(ry=sy;ry<img_height;ry++){
    index=computeIndex(rx,ry,img_width);
    if(data[index+3]==0)
      break;
  }
  ry--;
  var attend_lx=attendX+lx-sx;
  var attend_ly=attendY+ly-sy;
  var wid=rx-lx+1;
  var hei=ry-ly+1;
  console.log(lx,ly,rx,ry);

  ctx.drawImage(colorMap,attend_lx*wid_ratio,attend_ly*hei_ratio,
                      wid*wid_ratio,hei*hei_ratio, lx,ly,wid,hei);
}
function computeIndex(sx,sy,swidth){
  return (sx+sy*swidth)*4;
}
var flag=false;
function toggleBackground(){
  flag=!flag;
  if(flag){
    document.getElementById("img_layer").style.visibility="hidden";
    document.getElementById("tmp_layer").style.visibility="hidden";
  }else{
    document.getElementById("img_layer").style.visibility="visible";
    document.getElementById("tmp_layer").style.visibility="visible";
  }
}

//어플리케이션 시작
$(function () {
  processor.doLoad();
});