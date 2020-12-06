// To render the notes recorded
function paeCodeRender(paeCode, clef, width, scalePercent) {
    if (typeof(clef)==='undefined') clef = 'G-2';
    if (typeof(scalePercent)==='undefined') scalePercent = 80;

    let data = "@clef:" + clef + "\n";
    data += "@keysig:" + " " + "\n";
    data += "@timesig:" + " " + "\n";
    data += "@data:" + paeCode;

    let zoom = 80;
    let pageHeight = document.body.clientHeight * 100 / zoom ;
    let pageWidth = document.body.clientWidth * 90 / zoom ;

    let options = {
        pageHeight: 6000,
        pageWidth: pageWidth,
        pageMarginRight: 100,
        scale: scalePercent,
        adjustPageHeight: true,
        mmOutput: false,
    }

    verovioToolkit.setOptions(options);
    let notesSVG = verovioToolkit.renderData(data, options);

    let midiFile = verovioToolkit.renderToMIDI();
    let song = "data:audio/midi;base64," + midiFile;

    localStorage.setItem("song", song);
    document.getElementById("downloadMIDI").setAttribute('href', song);
    // document.getElementById("downloadMIDI").setAttribute('download', 'output_midi');

    let svgContainerDiv = document.getElementById('svgNotesContainer');
    svgContainerDiv.innerHTML = notesSVG;

    // Resize svg
    let newHeight = document.getElementById('svgNotesContainer').firstChild.getBoundingClientRect().height;
    document.getElementById('svgNotesContainer').style.height = newHeight + "px";
}


function filter_form(detail, det_level_label, pro, advanced) {
    let l_a = advanced.length;
    let l_p = pro.length;

    if (detail.value === '1') {
        det_level_label.textContent = 'Simple';
        for (let i = 0; i < l_a; i++) {
            advanced[i].style.display = 'none';
        }
        for (let i = 0; i < l_p; i++) {
            pro[i].style.display = 'none';
        }
    } else {
        for (let i = 0; i < l_a; i++) {
            advanced[i].style.display = 'inline';
        }
        if (detail.value === '2') {
            det_level_label.textContent = 'Advanced';
            for (let i = 0; i < l_p; i++) {
                pro[i].style.display = 'none';
            }
        } else {
            det_level_label.textContent = 'Pro';
            for (let i = 0; i < l_p; i++) {
                pro[i].style.display = 'inline';
            }
        }
    }
}

$(window).keyup(function(event) {
    if (event.keyCode === 27) {
        let modal = document.getElementById("pdfOptionsForm");
        modal.style.display = "none";
    }
});

document.getElementById("modalButton").onclick = function(event) {
    let modal = document.getElementById("pdfOptionsForm");
    const btn = document.getElementById("modalButton");

    const span = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
      modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
}

document.getElementById("downloadPDF").onclick = function(event) {
    let pdfFormat = "letter";
    if (document.getElementById("A4").checked) {
        pdfFormat = "A4";
    }
    let pdfOrientation = "landscape";
    if (document.getElementById("Portrait").checked) {
        pdfOrientation = "portrait";
    }
    generatePdf(pdfFormat, pdfOrientation);        
}


function generatePdf(pdfFormat, pdfOrientation) {
        
    const outputFilename = 'output.mei';
    let pdfSize = [2100, 2970];
    if (pdfFormat == "letter") pdfSize = [2159, 2794];
    else if (pdfFormat == "B4") pdfSize = [2500, 3530];
    
    const pdfLandscape = pdfOrientation === 'landscape';

    const pdfHeight = pdfLandscape ? pdfSize[0] : pdfSize[1];
    const pdfWidth = pdfLandscape ? pdfSize[1] : pdfSize[0];
            
    var doc = new PDFDocument({useCSS: true, compress: true, autoFirstPage: false, layout: pdfOrientation}); 
    var stream = doc.pipe(blobStream());
    
    stream.on('finish', function() {
        const blob = stream.toBlob('application/pdf');
        const pdfFilename = outputFilename.replace(/\.[^\.]+$/, '.pdf');
        saveAs(blob, pdfFilename);
    });
    
    const buffer = Uint8Array.from(atob(vrvTTF), c => c.charCodeAt(0));
    doc.registerFont('VerovioText',buffer);  
    
    let pdfOptions = {
        adjustPageHeight: false,
        breaks: "auto",
        mmOutput: true,
        footer: "auto",
        pageHeight: pdfHeight,
        pageWidth: pdfWidth,
        scale: 100
    }
    
    verovioToolkit.setOptions(pdfOptions);
    verovioToolkit.redoLayout();
    for (let i = 0; i < verovioToolkit.getPageCount(); i++) {
        doc.addPage({size: pdfFormat, layout: pdfOrientation});
        SVGtoPDF(doc, verovioToolkit.renderToSVG(i + 1, {}), 0, 0, pdfOptions);
    }
    
    doc.end();
}


function main() {
    // Keeping the "Level of Detail" slider setting saved in localStorage
    const detail = document.getElementById('detail');
    const det_level_label = document.getElementById('detail_level');
    
    const detail_level_setting = localStorage.getItem("detail_level_setting");

    if (detail_level_setting === null) {
        detail.value = detail_level_setting;
        detail.value = '2';
        localStorage.setItem("detail_level_setting", detail.value);
        det_level_label.textContent = 'Advanced';
    } else {
        detail.value = detail_level_setting
        if (detail.value ===  '1') {
            det_level_label.textContent = 'Simple';
        } else if (detail.value == '3') {
            det_level_label.textContent = 'Pro';
        } else {
            det_level_label.textContent = 'Advanced';
        }
        const advanced = document.getElementsByClassName("medium");
        const pro = document.getElementsByClassName("pro");

        filter_form(detail, det_level_label, pro, advanced);
    }

    // Displaying/hiding what is needed, depending on detail level
    detail.addEventListener('change', (event) => {
        localStorage.setItem("detail_level_setting", detail.value);

        const advanced = document.getElementsByClassName("medium");
        const pro = document.getElementsByClassName("pro");
        filter_form(detail, det_level_label, pro, advanced);
        
    });


    // To determine where the play button gets the midi file from
    // TODO: also link the download button accordingly
    let url = window.location.search;

    let localstorage_url = localStorage.getItem("midi_url");

    if (localstorage_url === null) {
        var midi_url = "https://carolan.uk.r.appspot.com/";
        // var midi_url = "http://localhost:8013/";
    } else {
        // url = window.location.search;
        const form_details = url.replace('?', '');
        var midi_url = "https://carolan.uk.r.appspot.com/song_gen?" + form_details;
        // var midi_url = "http://localhost:8013/song_gen?" + form_details;
        // console.log(midi_url);
        // localStorage.setItem("midi_url", midi_url);
    }


    url = window.location.search;
    const form_details = url.replace('?', '');
    const params = new URLSearchParams(form_details)
    params.forEach(function(val, key) {
        let key_id = document.getElementsByName(key)[0];
        key_id.value = val;
    });
    
    var midi_url = "http://localhost:8013/song_gen?" + form_details;
    
    console.log(midi_url);
    fetch(midi_url).then(res => res.json()).then((out) => {
        console.log('Output: ', out["pae"]);
        paeCodeRender(out["pae"], out["clef"], document.width, 80);
    }).catch(err => console.error(err));
}


main();
