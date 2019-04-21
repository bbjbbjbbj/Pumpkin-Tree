var apiUrl = location.protocol + '//' + location.host + "/api/";


$('#inquire').click(function() {
    updateInquire();
});


function updateInquire(){
    var insurance_id = $("#insurance_id").val() || 5
    paras = {
        "insurance_id":insurance_id
    }
    console.log(paras);
    $.ajax({
        type: 'GET',
        async: true,
        timeout: 5000,
        url: apiUrl + 'inquire',
        data: JSON.stringify(paras),
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function() {

        },
        success: function(data) {
            if (data.error) {
                alert(data.error);
                return;
            } else {
                content = "<div id=\"status-sm\">"
                content += "<p><br/>User Name:"
                content += data.name;
                content += "<br/>User Id:"
                content += data.user_id;
                content += "<br/>Insurance Id:"
                content += insurance_id;
                content += "<br/>Insurance Company Id:"
                content += data.company_id;
                content += "<br/>Insurance Quota:"
                content += data.quota;
                content += "<br/>Insurance Years:"
                content += data.year;
                content += "<br/>Insurance Status::"
                content += "1 Normal";
                content += "<br/>Remark:"
                content += data.remark;
                content += "<br/><p/></div>";
                document.getElementById("userinfo").innerHTML = content;
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Error: Try again")
            console.log(errorThrown);
            console.log(textStatus);
            console.log(jqXHR);
        },
        complete: function() {
    
        }
    });
    return false;
}



