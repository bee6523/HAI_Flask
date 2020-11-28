var app = Sammy(function () {
    
    //라우트 설정****
 
    this.get("#/", function () {
        //인덱스 페이지
        $("#stepInfo").text("Step1: Upload your image");
        $("#mainDiv").load("/pages/Upload.html");
    });

    this.get("#/step1", function (context) {
        $("#stepInfo").text("Step1: Upload your image");
        $("#userUploadedImage").show();
        $("#prevBtn").hide();
        $("#toolBox").hide();
    });
 
    this.get("#/step2", function () {
        startDrawing();
        $("#convertBtn").hide();
        $("#userUploadedImage").hide();
        $("#stepInfo").text("Step2: Mask your image");
        $("#prevBtn").show();
        $("#toolBox").show();
        $("#toolBox").load("./pages/Step2Components.html");
    });

    this.get("#/step3", function () {
        $("#convertBtn").show();
        document.getElementById("convertBtn").disabled=true;
        startAttending();
        $("#stepInfo").text("Step3: Set reference region");
        $("#nextBtn").show();
        $("#toolBox").load("./pages/Step3Components.html");
    });

    this.get("#/step4", function () {
        //do display
        $("#stepInfo").text("Step4: See the result");
        $('#result_layer').css("visibility","visible");
        $("#toolBox").load("./pages/Step4Components.html");
        $("#nextBtn").hide();
        $("#prevBtn").hide();
        $("#convertBtn").hide();
    });

    this.get("#/param/:id", function () {
        //파라미터 받기
        var nID = this.params['id'];
 
        $("#mainDiv").html("넘어온 파라미터 id : " + nID);
    });
 
});
 
//어플리케이션 시작
$(function () {
    app.run('#/');
});