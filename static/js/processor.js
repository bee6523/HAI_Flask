var image_file, image, colorMap, loadImage,
  img_width,img_height,
  img_layer, img_ctx,
  cnv_layer, cnv_ctx,
  att_layer, att_ctx,
  tmp_layer,tmp_ctx,
  result_layer, result_ctx,
  prevX,prevY,
  currX,currY,
  attendX,attendY;
var showingResult=true; //true if displaying result, false if modulating phase
var mask, attention;
var tool="rect";
var lineWidth=5;
var draw_flag=false;

let processor = {
    doLoad: function() {
      img_layer = document.getElementById("img_layer");
      cnv_layer = document.getElementById("canvas_layer");
      tmp_layer=document.getElementById("tmp_layer");
      att_layer=document.getElementById("att_layer");
      result_layer=document.getElementById("result_layer");
      img_ctx = img_layer.getContext("2d");
      cnv_ctx = cnv_layer.getContext("2d");
      tmp_ctx=tmp_layer.getContext("2d");
      att_ctx=att_layer.getContext("2d");
      result_ctx=result_layer.getContext("2d");
      colorMap = new Image();
      colorMap.src="/static/img/colorpalette.png";
      loadImage = new Image();
      loadImage.src="/static/img/loading.png";
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
            img_layer.width=cnv_layer.width=tmp_layer.width=result_layer.width=img_width;
            img_layer.height=cnv_layer.height=tmp_layer.height=result_layer.height=img_height;
            img_ctx.drawImage(image,0,0,img_width,img_height);
          });
          image.src=window.URL.createObjectURL(image_file);
          $('#nextBtn').show();
      })
    },
  };

function startDrawing(){
  document.getElementById("result_layer").style.visibility="hidden";
  tmp_ctx.clearRect(0,0,img_width,img_height);
  att_ctx.clearRect(0,0,img_width,img_height);
  tmp_layer.addEventListener("mousemove",doDraw);
  tmp_layer.addEventListener("mousedown",initDraw);
  tmp_layer.addEventListener("mouseup",endDraw);
  tmp_layer.addEventListener("mouseout",endDraw);
}
function startAttending(){
  document.getElementById("result_layer").style.visibility="visible";
  result_ctx.clearRect(0,0,img_width,img_height);
  result_ctx.drawImage(loadImage,img_width/2-50,img_height/2-50,100,100);
  
  mask=convertToMask();
  formData = new FormData();
  formData.append("img",img_layer.toDataURL("image/png"));
  formData.append("mask",mask);
  $.ajax({
      type: "POST",
      url: "/InitResult",
      data: formData,
      contentType: false,
      processData: false,
      cache: false,
      async: true,
      success: callback_getAttention
  });
  console.log("sent initial mask");
  tool="picker";
}

function showResult(){
  if(showingResult){
    document.getElementById("result_layer").style.visibility="hidden";
    $('#convertBtn').html("Convert");
    showingResult=false;
  }else{
    console.log(image.src);

    //show loading image while processing
    document.getElementById("result_layer").style.visibility="visible";
    result_ctx.clearRect(0,0,img_width,img_height);
    result_ctx.drawImage(loadImage,img_width/2-50,img_height/2-50,100,100);

    mask=convertToMask();
    attention=convertToAttImage();
    formData = new FormData();
    formData.append("img",img_layer.toDataURL("image/png"));
    formData.append("mask",mask);
    formData.append("att",attention);
    $.ajax({
        type: "POST",
        url: "/Result",
        data: formData,
        contentType: false,
        processData: false,
        cache: false,
        async: true,
        success: callback_getResult
    });
    console.log("send!!");
  }
}
function callback_getAttention(response){
  console.log("success!")
  console.log(response);
  var att_tmp=new Image();
  var result_image= new Image();
  result_image.addEventListener("load",(evt)=>{
    result_ctx.drawImage(result_image,0,0,img_width,img_height);
    $('#convertBtn').html("Modulate");
    $('#convertBtn').show();
  });
  att_tmp.addEventListener("load",(evt)=>{
    console.log(att_ctx.globalCompositeOperation);
    att_ctx.drawImage(cnv_layer,0,0,img_width,img_height);
    att_ctx.globalCompositeOperation="source-in";
    att_ctx.drawImage(att_tmp,0,0,img_width,img_height);
    att_ctx.globalCompositeOperation="source-over";
  });
  paths=response.split('&');
  result_image.src=paths[0]+ "?t=" + new Date().getTime();
  att_tmp.src=paths[1]+ "?t="+ new Date().getTime();
}

function callback_getResult(response){
  console.log(response);
  var result_image = new Image();
  result_image.addEventListener("load",(evt)=>{
    showingResult=true;
    result_ctx.drawImage(result_image,0,0,img_width,img_height);
    $('#convertBtn').html("Modulate");
  });
  result_image.src=response + "?t=" + new Date().getTime();
}

function convertToMask(){
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
  ctx.fillStyle="white";
  ctx.fillRect(0,0,img_width,img_height);
  ctx.drawImage(att_layer,0,0);

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
        marker_layer=document.getElementById("marker_layer");
        sm_ctx = marker_layer.getContext("2d");
        sm_ctx.clearRect(0,0,marker_layer.width,marker_layer.height);
        sm_ctx.beginPath();
        sm_ctx.arc(currX/3,currY/3,5,0,Math.PI*2,false);
        sm_ctx.arc(currX/3,currY/3,3,Math.PI*2,0,true);
        sm_ctx.fillStyle="red";
        sm_ctx.fill();
    }
  }
}
function endDraw(e){
  draw_flag=false;
  switch(tool){
    case "picker":
      attendX=currX;
      attendY=currY;
      /* colormap image -> ratio modified image : ratio calculation needed
      color_layer=document.getElementById("color_layer");
      box_ctx = color_layer.getContext("2d");
      color_layer.style.visibility="visible";
      box_ctx.clearRect(0,0,color_layer.width,color_layer.height);
      box_ctx.drawImage(colorMap,currX/3-5, currY/3-5, 10, 10, 0, 0, color_layer.width, color_layer.height);
      */
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
function palettesize() {
  var palette_width=img_width/3;
  var palette_height=img_height/3;
  pal_layer=document.getElementById("colorpalette");
  mark_layer=document.getElementById("marker_layer");
  pal_ctx = pal_layer.getContext("2d");
  mark_layer.width=pal_layer.width=palette_width;
  mark_layer.height=pal_layer.height=palette_height;
  pal_layer.style.visibility="visible";
  pal_ctx.clearRect(0,0,palette_width,palette_height);
  pal_ctx.drawImage(colorMap,0,0,palette_width,palette_height);
}

function drawAttention(sx,sy){
  var paletteCanvas=document.createElement("canvas");
  var p_ctx=paletteCanvas.getContext("2d");
  paletteCanvas.width=img_width;
  paletteCanvas.height=img_height;
  p_ctx.drawImage(colorMap,0,0,img_width,img_height);

  var imgData=cnv_ctx.getImageData(0,0,img_width,img_height);
  var paletteData=p_ctx.getImageData(0,0,img_width,img_height);
  var attentionData=att_ctx.getImageData(0,0,img_width,img_height);

  var traverseData=new Array(img_width*img_height);
  traverseData = traverseData.fill(0);

  fillInpaintingArea(imgData.data,paletteData.data,attentionData.data,sx,sy,traverseData);
  console.log("applyFill");
  att_ctx.putImageData(attentionData,0,0);
}


//three imgData should have same width/height.
function fillInpaintingArea(maskData,paletteData,attData,sx,sy, traverseData){
  trav_queue=new Array();
  index = computeIndex(sx,sy,img_width)
  startX=sx;
  startY=sy;
  if(maskData[index+3]==0){ //if click point is not inpainting region
    return;
  }
  trav_queue.push([sx,sy]);
  while(trav_queue.length>0){
    [sx,sy]=trav_queue.shift();
    if(traverseData[computeIndex(sx,sy,img_width)/4]!=0){
      continue;
    }
    for(lx=sx;lx>=0;lx--){
      index=computeIndex(lx,sy,img_width);
      if(maskData[index+3]==0){
        break;
      }
    }
    lx++;
    for(rx=sx;rx<img_width;rx++){
      index=computeIndex(rx,sy,img_width);
      if(maskData[index+3]==0)
        break;
    }
    rx--;

    for(sx=lx;sx<=rx;sx++){
      index=computeIndex(sx,sy,img_width);
      traverseData[index/4]=1;  //mark as traversed

      ax=attendX+(sx-startX);
      ay=attendY+(sy-startY);
      if(ax>=0 && ax<img_width && ay>=0 && ay<img_height){ 
        //fill color if attending region is in image boundary
        attend_index=computeIndex(ax,ay,img_width);
  
        [r,g,b,a]=paletteData.slice(attend_index,attend_index+4);
        attData[index]=r;
        attData[index+1]=g;
        attData[index+2]=b;
        attData[index+3]=a;
      }

      index=computeIndex(sx,sy+1,img_width);
      if(maskData[index+3]!=0){
        trav_queue.push([sx,sy+1]);
      }
      index=computeIndex(sx,sy-1,img_width);
      if(maskData[index+3]!=0){
        trav_queue.push([sx,sy-1]);
      }
    }
  }
  
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