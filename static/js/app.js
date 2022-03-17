// function to find what stage is most predicted
function maxKey(data) {  
    var maxProp = null
    var maxValue = -1
    for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
            var value = data[prop]
            if (value > maxValue) {
                maxProp = prop
                maxValue = value
            }
        }
    }
    return maxProp;  
}

// function to remove text and displays from the html as well as re-set necessary background colors to white
function clearScreen() {
    $("#no-prediction").text("");
    $("#mild-prediction").text("");
    $("#mod-prediction").text("");
    $("#sev-prediction").text("");
    $("#pro-prediction").text("");
    $('#image-filename').text("");
    $("#row-chart").empty();
    $("#custom-table").css("display", "none");
    $("#stages-table").css("display", "none");
    $("#pro-desc").css('background-color', 'white')
    $("#sev-desc").css('background-color', 'white')
    $("#mod-desc").css('background-color', 'white')
    $("#mild-desc").css('background-color', 'white')
}

// create variable to hold the image so it can be inlined into html 
let base64Image

// if an image is selected on the html
$('#image-selector').change(function (e) {
  // grab filename of the selected file
  let fileName = e.target.files[0].name;
  // define a FileReader object to read the contents of the image file that the user selects   
  let reader = new FileReader();
  // utilize onload handler when reader loads and successfully reads the contents of the selected file  
  reader.onload = function (e) {
    // reader.result contains the image data as a URL that represents the file's data as a base64 encoded string  
    let dataURL = reader.result;
    // set the src attrib of the selected-image to the dataURL so the image will be displayed on the page
    $('#selected-image').attr('src', dataURL);
    // remove the URL portion of the image (metadata), leaving us with just the base64 encoded contents of the image file
    base64Image = dataURL.replace(/^data:image\/(png|jpg|jpeg|gif);base64,/, "");
    // put file name on screen
    $('#image-filename').text(fileName);
  }
  // load the selected image to the screen (triggering the onload handler above)
  reader.readAsDataURL($("#image-selector")[0].files[0]);
  // clean up any prior predictions or charts if necessary by calling function clearScreen()
  clearScreen();
});

//  on click of predict button
$('#predict-button').click(function (event) {
  // define a message dictionary with key set to 'image' and value set to the base64 binary image data
  let message = {
    image: base64Image
  }
  // make a POST request to the /predict endpoint with the message formatted in JSON and define a function for handling response
  $.post("/predict", JSON.stringify(message), function (response) {
    try{
        // BUILD ROW CHART
        // format response data into array of js objects for Crossfilter/dc row chart
        let predictions_array = Object.entries(response.prediction).map(function (entry) {
            return {
             category: entry[0],
             value: entry[1]
            };
        });
        // create a crossfilter object based on formatted data
        let cf = crossfilter(predictions_array);
        // plot the row chart by category (i.e. level of severity)
        let category = cf.dimension(p=>p.category);
        // define the row chart using the category and values
        myRowChart = dc.rowChart('#row-chart').dimension(category).group(category.group().reduceSum(p=>p.value));
        // specify the order the row chart should be displayed; always by catgory: None to Proliferative
        myRowChart.ordering(function(d) {
            if(d.key == "None") return 0;
            else if(d.key == "Mild") return 1;
            else if(d.key == "Moderate") return 2;
            else if(d.key == "Severe") return 3;
            else if(d.key == "Proliferative") return 4;
        });
        // render the chart
        dc.renderAll();

        // BUILD PREDICTION TABLE
        // clean up percentages for prediction display and grab prediction values from the response
        $("#no-prediction").text((response.prediction.None * 100).toFixed(2) + '%');
        $("#mild-prediction").text((response.prediction.Mild * 100).toFixed(2) + '%');
        $("#mod-prediction").text((response.prediction.Moderate * 100).toFixed(2) + '%');
        $("#sev-prediction").text((response.prediction.Severe * 100).toFixed(2) + '%');
        $("#pro-prediction").text((response.prediction.Proliferative * 100).toFixed(2) + '%');
        $("#custom-table").css("display", "block");
        $("#stages-table").css("display", "block");
        console.log(response);

        // HIGH-LIGHT TABLE CELL FOR DESCRIPTION OF STAGE PREDICTED IN STAGES TABLE
        // call maxStage function to find what stage is most predicted
        let maxStage = maxKey(response.prediction);
        console.log("Max Stage: " + maxStage);
        if (maxStage === 'Proliferative'){
            $("#pro-desc").css('background-color', '#ffffb3')
        } else if (maxStage === 'Severe' ){
            $("#sev-desc").css('background-color', '#ffffb3')
        } else if (maxStage === 'Moderate'){
            $("#mod-desc").css('background-color', '#ffffb3')
        } else if (maxStage === 'Mild'){
            $("#mild-desc").css('background-color', '#ffffb3')
        } else {
            console.log("There is no DR predicted for this image!")
        }
    }
    catch (TypeError){
        console.log("No response prediction was found. Verify an image file was selected.");
    }
  });
});

// clear screen and remove image when clear button is clicked
$('#clear-button').click(function (event) {
    // call function clearScreen
    clearScreen();
    $('#selected-image').attr('src', '');
    base64Image = null;
});

// when the html initially loads, don't display the custom-table or stages-table
function load(){
  $("#custom-table").css("display", "none");
  $("#stages-table").css("display", "none");
}

// Embbeding Tableau in HTML
function initViz() {
    var containerDiv = document.getElementById("vizContainer"),
        url = "https:///public.tableau.com/views/DR-USA_Prevalence/Dashboard1?:embed=yes",
        options = {
            hideTabs: true,
            responsive: true,
            onFirstInteractive: function () {
                console.log("Run this code when the viz has finished loading.");
            }
        };

    var viz = new tableau.Viz(containerDiv, url, options);
    // Create a viz object and embed it in the container div.
}
