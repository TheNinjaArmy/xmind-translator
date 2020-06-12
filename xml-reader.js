const fs = require('fs')
var JSZip = require("./jszip");
var stringSimilarity = require('./string-similarity');
const path = require('path');
const config = require('./configuration');
var found_entities = [];

function verifyNode(str, level){
    var valorNodo = str.normalize('NFKC').toLowerCase();
    var palabras_reservadas = config.niveles_valores[level];

    var matches = stringSimilarity.findBestMatch(valorNodo, palabras_reservadas);

    if(matches.bestMatch.rating >= config.similarity_rate[level]) return 1;
    else return 0;
}

function xmlRelationships(xml) {
    var objRelations = {};

    if (typeof xml !== 'undefined'){
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var objRelation = {};

            objRelation["end1"] = item.getAttribute("end1"); 
            objRelation["end2"] = item.getAttribute("end2"); 
            objRelations["relation_"+ i] = objRelation;
        }
    } else /*throw*/ app.dialogs.showAlertDialog("There are no relations between entities in the mind map" );
    return {"relationships" :objRelations};
}



/**
 * @param {string} xml XML DOM tree
 */
function xmlToJson(xml, level) {
    var obj = {};

    if (xml.nodeType == 1 && xml.tagName=="topic") {  
        if (xml.attributes.length > 0) {
            obj["id"] = xml.getAttribute("id"); 
        }
    } else if (xml.nodeType == 3) {
        obj = xml.nodeValue;
    }
  
    var textNodes = [].slice.call(xml.childNodes).filter(function(node) {
        return node.nodeType === 3;
    });
    if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
        obj = [].slice.call(xml.childNodes).reduce(function(text, node) {
            return text + node.nodeValue;
        }, "");
    } else if (xml.hasChildNodes()) {
        var arrObj = [];
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            var last_ver = false;

            if(nodeName == "marker-refs" && level==14){                                                                             
                var marker = item.childNodes.item(0);
                if(marker.getAttribute("marker-id")=="star-yellow") obj["last_version"] = "true";
                else obj["last_version"] = "false";
            }
            else if(nodeName == "title"){              
                var valorNodoTItulo = xmlToJson(item, level+1).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                if(verifyNode(valorNodoTItulo, level)) {
                    obj[config.niveles_t[level]] = valorNodoTItulo;
                    if(!(found_entities.includes(valorNodoTItulo))  && level==17) found_entities.push(valorNodoTItulo);
                }
                else return null;
            }
            else if(nodeName == "children") {
                var topics = item.childNodes.item(0);

                if(item.childNodes.length>1){
                    for (var j = 1; j < item.childNodes.length; j++) {
                        var topicsExtract = item.childNodes.item(j);
                        var chidNodesSize = topicsExtract.childNodes.length;
                        for (var k = 0; k < chidNodesSize ; k++) {

                            topics.appendChild(topicsExtract.childNodes.item(0));
                        }
                    }
                }

                var objContent = xmlToJson(topics, level+2);
                var filtered = objContent.filter(function (el) {
                    return el != null;
                });
                
                obj["CONTENT"] = filtered;
            } else if(nodeName == "topic") {
                var topicObj = {} ;
                topicObj = xmlToJson(item, level+1);
                arrObj.push(topicObj);
            }
        }
    }
    if(xml.nodeName== "topics") obj = arrObj;
    return obj;
}

function filterJSON(json, level) {
    var obj = {};

    if(verifyNode(json["title"], level)){
        obj["id"] = json["id"];
        var valorNodoTitulo = json["title"].normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        obj[config.niveles_t[level]] = valorNodoTitulo;
        if(!(found_entities.includes(valorNodoTitulo)) && level==17) found_entities.push(valorNodoTitulo);
    } else return null;

    var arrObj = [];
    if(json.hasOwnProperty('children') && json.children.hasOwnProperty('attached')){
        for(var i = 0; i<json.children.attached.length; i++){
            
            var objContent = filterJSON(json.children.attached[i], level+3);
            
            arrObj.push(objContent);
            var filtered = arrObj.filter(function (el) {
                return el != null;
            });
            
            // if(filtered.length == 0) /*throw*/ app.dialogs.showAlertDialog("There are no components in the layer \"" + config.niveles_t[level] + "\"" );
            
            obj["CONTENT"] = filtered;
        }
    }

    return obj;
}


function loadFromFile (filename) {

    var result= {};
    var path_separator = '';

    if(navigator.platform.includes("Linux") || navigator.platform.includes("Mac")) path_separator = '/';
    else if (navigator.platform.includes("Win32") || navigator.platform.includes("Win16")) path_separator = '\\';

    fs.readFile(filename, function(err, data) {
        if (err) app.dialogs.showSimpleDialog(err);
        JSZip.loadAsync(data)
        .then(function (zip) {
            return zip.file("content.json").async("string");
        }).then( (content_json) => {
            
            var obj = JSON.parse(content_json);
            result = filterJSON(obj[0].rootTopic, 2);
            
            fs.writeFile(path.parse(filename).dir + path_separator + path.parse(filename).name + '.json', JSON.stringify(result), function(err) {

                var message = "Found entitites:\n";
                for(var i=0; i<found_entities.length; i++){
                    message += "\t" + found_entities[i] + "\n";
                }
                app.dialogs.showSimpleDialog(message);
                
                if (err) app.dialogs.showSimpleDialog(err);
                else app.dialogs.showSimpleDialog("JSON file created");
            });
            

        }).catch((error) =>  {
            console.log(error);
            JSZip.loadAsync(data).then(function (zip) {        
                return zip.file("content.xml").async("string");
            }).then( (content_xml) => {

                var parser = new DOMParser();
                var dom = parser.parseFromString(content_xml, 'text/xml');
                var XML = dom.getElementsByTagName('topic')[0]  ; ////cmabiar cuando el otro cambie     <------------(1)
                result = xmlToJson(XML, 2);    ////cmabiar cuando el otro cambie     <------------(1)


                fs.writeFile(path.parse(filename).dir + path_separator + path.parse(filename).name + '.json', JSON.stringify(result), function(err) {

                    var message = "Found entitites:\n";
                    for(var i=0; i<found_entities.length; i++){
                        message += "\t" + found_entities[i] + "\n";
                    }
                    app.dialogs.showSimpleDialog(message);

                    if (err) app.dialogs.showSimpleDialog(err);
                    else app.dialogs.showSimpleDialog("JSON file created");
                });
                
            });
        });
    });

}







exports.loadFromFile = loadFromFile