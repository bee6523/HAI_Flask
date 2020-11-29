var image_file, image, colorMap, loadImage,
  img_width,img_height,
  img_layer, img_ctx,
  cnv_layer, cnv_ctx,
  att_layer, att_ctx,
  tmp_layer,tmp_ctx,
  result_layer, result_ctx,
  prevX,prevY,
  currX,currY,
  attendlX,attendlY,
  attendrX,attendrY,
  lineLx, lineLy,
  lineHx, lineHy;
var showingResult=true; //true if displaying result, false if modulating phase
var mask, attention;
var tool="rect";
var lineWidth=5;
var draw_flag=false;
var change_flag=true;
var maskUndoList=[];
var attUndoList=[];

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
            if(ratio>(400/560)){
              img_width=parseInt(400/ratio);
              img_height=400;
            }else{
              img_width=560;
              img_height=parseInt(560*ratio);
            }
            img_layer.width=cnv_layer.width=tmp_layer.width=result_layer.width=parseInt(img_width/8)*8;
            img_layer.height=cnv_layer.height=tmp_layer.height=result_layer.height=parseInt(img_height/8)*8;
            img_ctx.drawImage(image,0,0,img_width,img_height);
            img_width = parseInt(img_width/8)*8;
            img_height = parseInt(img_height/8)*8;
            cnv_ctx.clearRect(0,0,img_width,img_height);
            att_ctx.clearRect(0,0,img_width,img_height);
          });
          image.src=window.URL.createObjectURL(image_file);
          $('#nextBtn').show();
      })
    },
  };

function startDrawing(){
  document.getElementById("result_layer").style.visibility="hidden";
  att_layer.style.visibility="hidden";
  tmp_ctx.clearRect(0,0,img_width,img_height);
  //att_ctx.clearRect(0,0,img_width,img_height);
  tmp_layer.addEventListener("mousemove",doDraw);
  tmp_layer.addEventListener("mousedown",initDraw);
  tmp_layer.addEventListener("mouseup",endDraw);
  tmp_layer.addEventListener("mouseout",endDraw);
  tool="rect";
}
function startAttending(){
  console.log(change_flag)
  att_layer.style.visibility="visible";
  if(change_flag == false){
    document.getElementById("convertBtn").disabled=false;
    if(showingResult){
      document.getElementById("result_layer").style.visibility="visible";
    }
    return;
  }

  document.getElementById("result_layer").style.visibility="visible";
  result_ctx.clearRect(0,0,img_width,img_height);
  result_ctx.drawImage(loadImage,img_width/2-50,img_height/2-50,100,100);

  document.getElementById("convertBtn").disabled=true;
  
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
  tool="null";
}

function showResult(){
  if(showingResult){
    document.getElementById("result_layer").style.visibility="hidden";
    $('#convertBtn').html("Convert");
    $('#attendingGadgets').show();
    $('#mapContainer').show();
    tool="picker";
    showingResult=false;
  }else{
    if(change_flag == false){
      document.getElementById("result_layer").style.visibility="visible";
      $('#convertBtn').html("Modulate");
      document.getElementById("convertBtn").disabled=false;
      $('#attendingGadgets').hide();
      $('#mapContainer').hide();
      showingResult=true;
      return;
    }

    console.log(image.src);

    //show loading image while processing
    document.getElementById("result_layer").style.visibility="visible";
    result_ctx.clearRect(0,0,img_width,img_height);
    result_ctx.drawImage(loadImage,img_width/2-50,img_height/2-50,100,100);

    document.getElementById("convertBtn").disabled=true;
    $('#attendingGadgets').hide();
    $('#mapContainer').hide();

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
    change_flag=false;
    attUndoList=[];
    $('#convertBtn').html("Modulate");
    document.getElementById("convertBtn").disabled=false;
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
    change_flag=false;
    result_ctx.drawImage(result_image,0,0,img_width,img_height);
    $('#convertBtn').html("Modulate");
    document.getElementById("convertBtn").disabled=false;
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
    attUndoList.push(att_ctx.getImageData(0,0,img_width,img_height));
    fillAttention(e.layerX,e.layerY);
    change_flag=true;
    return;
  }
  else if (tool=="brush_3"){
    draw_flag=true;
    currX = e.layerX;
    currY = e.layerY;
    prevX=currX;
    prevY=currY;
    lineLx=currX;
    lineLy=currY;
    lineHx=currX;
    lineHy=currY;
  }
  else if (tool=="rect" || tool=="rect_3"){
    draw_flag=true;
    currX = parseInt(e.layerX/8)*8;
    currY = parseInt(e.layerY/8)*8;
    prevX=currX;
    prevY=currY;
  }
  else{
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
        currX=parseInt(e.layerX/8)*8;
        currY=parseInt(e.layerY/8)*8;
        tmp_ctx.fillStyle="white";
        tmp_ctx.fillRect(prevX,prevY,currX-prevX,currY-prevY);
        break;
      case "picker":
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        currX=e.layerX;
        currY=e.layerY;
        tmp_ctx.lineWidth=1;
        tmp_ctx.strokeStyle="black";
        tmp_ctx.setLineDash([4, 4]);
        tmp_ctx.strokeRect(prevX,prevY,currX-prevX,currY-prevY);
        /* display attention region in colormap element */
        marker_layer=document.getElementById("marker_layer");
        sm_ctx = marker_layer.getContext("2d");
        sm_ctx.clearRect(0,0,marker_layer.width,marker_layer.height);
        sm_ctx.strokeStyle="red";
        sm_ctx.strokeRect(prevX/3,prevY/3,(currX-prevX)/3,(currY-prevY)/3);
        break;
      case "rect_3":
        color_layer=document.getElementById("color_layer");
        box_ctx = color_layer.getContext("2d");
        pixData = box_ctx.getImageData(10,10,1,1);
        [r, g, b, a] = pixData.data;
        if ([r,g,b,a]!=[0,0,0,0]) {
          tmp_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
          currX=parseInt(e.layerX/8)*8;
          currY=parseInt(e.layerY/8)*8;
          tmp_ctx.fillStyle=`rgba(${r},${g},${b},${a/255})`;
          tmp_ctx.fillRect(prevX,prevY,currX-prevX,currY-prevY);
        }
        break;
      case "brush_3":
        color_layer=document.getElementById("color_layer");
        box_ctx = color_layer.getContext("2d");
        pixData = box_ctx.getImageData(10,10,1,1);
        [r, g, b, a] = pixData.data;
        if ([r,g,b,a]!=[0,0,0,0]) {
          if (currX<lineLx) lineLx = currX;
          if (currX>lineHx) lineHx = currX;
          if (currY<lineLy) lineLy = currY;
          if (currY>lineHy) lineHy = currY;
          prevX = currX;
          prevY = currY;
          currX = e.layerX;
          currY = e.layerY;
          tmp_ctx.beginPath();
          tmp_ctx.moveTo(prevX, prevY);
          tmp_ctx.lineTo(currX, currY);
          tmp_ctx.strokeStyle =`rgba(${r},${g},${b},${a/255})`;
          tmp_ctx.lineWidth = lineWidth;
          tmp_ctx.lineCap = "round";
          tmp_ctx.stroke();
          tmp_ctx.closePath();
        }
        break;
    }
  }
}
function endDraw(e){
  if(draw_flag){
    draw_flag=false;
    switch(tool){
      case "picker":
        attendlX=prevX;
        attendlY=prevY;
        attendrX=currX;
        attendrY=currY;
        /* display color preview in colormap element */
        color_layer=document.getElementById("color_layer");
        box_ctx = color_layer.getContext("2d");
        box_ctx.clearRect(0,0,color_layer.width,color_layer.height);
        hratio = colorMap.height/tmp_layer.height;
        wratio = colorMap.width/tmp_layer.width;
        box_ctx.drawImage(colorMap,(prevX+currX)/2*wratio-5, (prevY+currY)/2*hratio-5, 10, 10, 0, 0, color_layer.width, color_layer.height);
        break;
      case "fill":
        break;
      case "rect_3":
        attUndoList.push(att_ctx.getImageData(0,0,img_width,img_height));

        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        recWidth = currX-prevX;
        recHeight = currY-prevY;
        hratio = colorMap.height/tmp_layer.height;
        wratio = colorMap.width/tmp_layer.width;
        att_ctx.globalCompositeOperation = "source-atop";
        att_ctx.drawImage(colorMap,attendlX*wratio,attendlY*hratio,(attendrX-attendlX)*wratio,(attendrY-attendlY)*hratio,prevX,prevY,recWidth,recHeight);
        att_ctx.globalCompositeOperation = "source-over";

        change_flag=true;
        break;
      case "brush_3":
        attUndoList.push(att_ctx.getImageData(0,0,img_width,img_height));

        pathWidth = lineHx-lineLx+2*lineWidth;
        pathHeight = lineHy-lineLy+2*lineWidth;
        hratio = colorMap.height/tmp_layer.height;
        wratio = colorMap.width/tmp_layer.width;
        tmp_ctx.globalCompositeOperation = "source-in";
        tmp_ctx.drawImage(colorMap,attendlX*wratio,attendlY*hratio,(attendrX-attendlX)*wratio,(attendrY-attendlY)*hratio,lineLx-lineWidth,lineLy-lineWidth,pathWidth,pathHeight);
        tmp_ctx.globalCompositeOperation = "source-over";
        att_ctx.globalCompositeOperation = "source-atop";
        att_ctx.drawImage(tmp_layer,0,0);
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        att_ctx.globalCompositeOperation = "source-over";
        
        change_flag=true;
        break;
      default:
        maskUndoList.push(cnv_ctx.getImageData(0,0,img_width,img_height));
        cnv_ctx.drawImage(tmp_layer,0,0);
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        change_flag=true;
    }
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

function undodo(){
  if(maskUndoList.length>0){
    cnv_ctx.putImageData(maskUndoList.pop(),0,0);
  }
}
function recrec() {
  tool="rect";
  document.getElementById("brushBtn").disabled=false;
  document.getElementById("rectBtn").disabled=true;  
}
function brusrush(n) {
  tool="brush";
  lineWidth=n;
  document.getElementById("rectBtn").disabled=false;
  document.getElementById("brushBtn").disabled=true;
}

function undodo_3(){
  if(attUndoList.length>0){
    att_ctx.putImageData(attUndoList.pop(),0,0);
  }
}
function pickicker() {
  tool="picker";
  document.getElementById("pickerBtn").disabled=true;
  /*document.getElementById("fillBtn").disabled=false;*/
  document.getElementById("rect3Btn").disabled=false;
  document.getElementById("brush3Btn").disabled=false;
}
/*
function fillill() {
  tool="fill";
  document.getElementById("pickerBtn").disabled=false;
  document.getElementById("fillBtn").disabled=true;
  document.getElementById("rect3Btn").disabled=false;
  document.getElementById("brush3Btn").disabled=false;
}
*/
function rectect() {
  tool="rect_3";
  document.getElementById("pickerBtn").disabled=false;
  /*document.getElementById("fillBtn").disabled=false;*/
  document.getElementById("rect3Btn").disabled=true;
  document.getElementById("brush3Btn").disabled=false;

}
function brusrush_3(n) {
  tool="brush_3";
  lineWidth=n;
  document.getElementById("pickerBtn").disabled=false;
  /*document.getElementById("fillBtn").disabled=false;*/
  document.getElementById("rect3Btn").disabled=false;
  document.getElementById("brush3Btn").disabled=true;
}

function palettesize() {
  var palette_width=img_width/3;
  var palette_height=img_height/3;
  pal_layer=document.getElementById("colorpalette");
  mark_layer=document.getElementById("marker_layer");
  reg_layer=document.getElementById("region_layer");
  pal_ctx = pal_layer.getContext("2d");
  reg_layer.width=mark_layer.width=pal_layer.width=palette_width;
  reg_layer.height=mark_layer.height=pal_layer.height=palette_height;
  pal_layer.style.visibility="visible";
  pal_ctx.clearRect(0,0,palette_width,palette_height);
  pal_ctx.drawImage(colorMap,0,0,palette_width,palette_height);
}

function fillAttention(sx,sy){
  var paletteCanvas=document.createElement("canvas");
  var p_ctx=paletteCanvas.getContext("2d");
  paletteCanvas.width=img_width;
  paletteCanvas.height=img_height;
  document.body.appendChild(paletteCanvas);

  var imgData=cnv_ctx.getImageData(0,0,img_width,img_height);
  var paletteData=p_ctx.getImageData(0,0,img_width,img_height);

  var traverseData=new Array(img_width*img_height);
  traverseData = traverseData.fill(0);

  [paintlX,paintlY,paintrX,paintrY] = fillInpaintingArea(imgData.data,paletteData.data,sx,sy,traverseData);

  p_ctx.putImageData(paletteData,0,0);
  recWidth = paintrX-paintlX;
  recHeight = paintrY-paintlY;
  hratio = colorMap.height/img_height;
  wratio = colorMap.width/img_width;
  p_ctx.globalCompositeOperation = "source-atop";
  p_ctx.drawImage(colorMap,attendlX*wratio,attendlY*hratio,(attendrX-attendlX)*wratio,(attendrY-attendlY)*hratio,paintlX,paintlY,recWidth,recHeight);
  p_ctx.globalCompositeOperation = "source-over";

  //att_ctx.globalCompositeOperation="destination-over";
  att_ctx.drawImage(paletteCanvas,0,0);
  
  console.log("applyFill");
}


//three imgData should have same width/height.
function fillInpaintingArea(maskData,attData,sx,sy, traverseData){
  trav_queue=new Array();
  index = computeIndex(sx,sy,img_width)
  startX=sx;
  startY=sy;
  var paintlX=img_width,paintlY=img_height,paintrX=0,paintrY=0;
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

    if(lx<paintlX) paintlX=lx;
    if(rx>paintrX) paintrX=rx;
    if(sy<paintlY) paintlY=sy;
    if(sy>paintrY) paintrY=sy;

    for(sx=lx;sx<=rx;sx++){
      index=computeIndex(sx,sy,img_width);
      traverseData[index/4]=1;  //mark as traversed

      attData[index]=255;
      attData[index+1]=255;
      attData[index+2]=255;
      attData[index+3]=255;

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

  return [paintlX,paintlY,paintrX,paintrY];
  
}
function computeIndex(sx,sy,swidth){
  return (sx+sy*swidth)*4;
}

function downloadResultImage(el){
  el.href=result_layer.toDataURL("image/png");
  el.download = "result.png";
}

//어플리케이션 시작
$(function () {
  processor.doLoad();
});