var app = Sammy(function () {
    
    //라우트 설정****
 
    this.get("#/", function () {
        //인덱스 페이지
        $("#prevBtn").hide();
        $("#restartBtn").hide();
        $("#stepInfo").text("Step1: Upload your image");
        $("#mainDiv").load("/pages/Upload.html");
    });
 
    this.get("#/step2", function () {
        startDrawing();
        $("#userUploadedImage").hide();
        $("#stepInfo").text("Step2: Mask your image");
        $("#prevBtn").show();
        $("#toolBox").load("./pages/Step2Components.html");
    });

    this.get("#/step3", function () {
        startAttending();
        $("#step2Components").hide();
        $("#stepInfo").text("Step3: Set reference region");
        $("#nextBtn").show();
        $("#toolBox").load("./pages/Step3Components.html");
    });

    this.get("#/step4", function () {
        //do display
        $("#stepInfo").text("Step4: See the result");
        $("#step3Components").hide();
        $("#nextBtn").hide();
        $("#prevBtn").hide();
        $("#restartBtn").show();
    });

    this.get("#/param/:id", function () {
        //파라미터 받기
        var nID = this.params['id'];
 
        $("#mainDiv").html("넘어온 파라미터 id : " + nID);
    });
 
});
 
//어플리케이션 시작
$(function () {
    app.run('#/')
});