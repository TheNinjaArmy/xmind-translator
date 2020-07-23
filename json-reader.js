const fs = require('fs')
const path = require('path');

/*
https://s3.amazonaws.com/staruml-bucket/docs/3.0.0/api/index.html

AppContext contiene todos los keys que el objeto necesita para acceder a cada método
Ejm:
    createDiagram(options) está en la sección de Factory
    de ahi vamos a AppContext y buscamos el key que sea 'An instance of Factory', el cual seria factory
    por lo que para acceder al método se necesita hacer:
        app.factory.createDiagram(options);
*/

function create_class (diagram, name, x1=100, x2=200, y1=100, y2=200) {
    var options = {
        id: "UMLClass",
        parent: diagram._parent,
        diagram: diagram,
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        modelInitializer: function (elem) {
          elem.name = name;
        //   elem.isAbstract = true;
        }
    }
    var classView = app.factory.createModelAndView(options);
    return classView;
}

function create_association (diagram, tailClass, headClass, name="association", end="inicia", multiplicity="0..1", aggregation="shared") {     //tailClass = donde inicia la asociación
    var options = {
        id: "UMLAssociation",
        parent: diagram._parent,
        diagram: diagram,
        tailView: tailClass,
        headView: headClass,     /////TODO: decidir como manejar los tipos de relaciones
        tailModel: tailClass.model,
        headModel: headClass.model,
        modelInitializer: function (elem) {
            /////////////////////////END1////////////////////////
            elem.name=name;
            if(aggregation == "dir") elem.end1.navigable = true;
            else {
                elem.end1.navigable = false;
                elem.end1.aggregation = aggregation;
            }
            elem.end1.multiplicity = multiplicity;    // 0..1 -- 1 -- 0..* -- 1..* -- *
            elem.end1.name = end;     // "none"  "shared"  "composite"
            /////////////////////////END1////////////////////////
            elem.end2.navigable = false;
            // elem.end2.name = "termina";
            // elem.end2.multiplicity = "0..1";    // 0..1 -- 1 -- 0..* -- 1..* -- *
            // elem.end2.aggregation = "shared"     // "none"  "shared"  "composite"
        }
    }
    var assoView = app.factory.createModelAndView(options)
    return assoView;
}

function update_association(association, name="association", end="inicia", multiplicity="0..1", aggregation="shared"){
    app.engine.setProperty(association.model, "name", name);
    if(aggregation == "dir") app.engine.setProperty(association.model.end2, "navigable", true);////elem.model.end1.naviagble = true;
    else app.engine.setProperty(association.model.end2, "aggregation", aggregation);
    app.engine.setProperty(association.model.end2, "multiplicity", multiplicity);
    app.engine.setProperty(association.model.end2, "name", end);
}

function create_attribute (classview, name="NombreAtributo", type="INT") {     //tailClass = donde inicia la asociación
    var options = {
        id: "UMLAttribute",
        parent: classview.model,
        field : "attributes",
        modelInitializer: function (elem) {
            elem.name = name;
            elem.type = type; 
        }
    }
    var assoView = app.factory.createModel(options)
    return assoView;
}

function create_diagram (obj) {

    var project = app.project.getProject()
    var model = project.ownedElements[0]
    app.engine.setProperty(model, 'name', 'XMind');
    
    var diagram = app.diagrams.getCurrentDiagram();
    app.engine.setProperty(diagram, 'name', obj.SYSTEM);

    var classes = [];
    var attributes = [];
    var associations = [];
    var associationTracer = {};


    var i = 1;
    var separator = 200
    obj.CONTENT.forEach(process => {
        if("CONTENT" in process) {
            process.CONTENT.forEach(requirements => {
                if("CONTENT" in requirements) {
                requirements.CONTENT.forEach(requirement => {
                    if("CONTENT" in requirement) {
                    requirement.CONTENT.forEach(entities => {
                        if("CONTENT" in entities){
                        entities.CONTENT.forEach(entity => {
                            
                            var aux = 2*i%10==0? 10:0;
                            var x1 = ((2*i-1) %10);
                            var x2 = ((2*i) %10)+aux;
                            var y1 = (Math.floor((i-1)/5)*2+1);
                            var y2 = (Math.floor((i-1)/5)*2+2);

                            if(!(classes.some(classEntity => classEntity.entity === entity.ENTITY))){
                                var classview = create_class(diagram, entity.ENTITY.normalize('NFKC').replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]+/ig, "_"), x1*separator, x2*separator, y1*separator, y2*separator);
                                classes.push(
                                    {   "entity":     entity.ENTITY,
                                        "classview" : classview
                                    });
                                i++;
                                if(!(entity.ENTITY in associationTracer)) associationTracer[entity.ENTITY] = {};
                                for(var classKey in associationTracer)
                                    for(var classKey2 in associationTracer)
                                        if(!(associationTracer[classKey][classKey2]))
                                            associationTracer[classKey][classKey2] = null;
                            }

                            if("CONTENT" in entity){
                                entity.CONTENT.forEach(atributes => {
                                if("CONTENT" in atributes){
                                    atributes.CONTENT.forEach(atribute => {
                                    if("CONTENT" in atribute){

                                        let regex = "^<[a-zA-Z0-9 ]*>$";
                                        var sameEntity = (element) => element.entity == entity.ENTITY;
                                        var index = classes.findIndex(sameEntity);
                                        var entityClassView = classes[index].classview;

                                        if(!atribute.ATTRIBUTE.match(regex)){
                                            
                                            // if("CONTENT" in atribute.CONTENT[3]){
                                            //     for(j=0; j<atribute.CONTENT[3].CONTENT.length; j++){}
                                            // }
                                            
                                            var sameEntity = (element) => (element.name == atribute.CONTENT[0].CONSIDERATIONS) && (element._parent.name == entityClassView.model.name);
                                            var index = attributes.findIndex(sameEntity);

                                            if(index == -1)
                                                attributes.push(create_attribute(entityClassView, atribute.CONTENT[0].CONSIDERATIONS, atribute.CONTENT[2].CONSIDERATIONS));

                                        } else {
                                            atribute.CONTENT.forEach(relatedEntities => {
                                                var relationObj = {};                                            
                                                if("CONTENT" in relatedEntities){
                                                    if(typeof relatedEntities.CONTENT[0] !== 'undefined') relationObj["association_name"] = relatedEntities.CONTENT[0]["ENTITY-RELATION"];
                                                    if(typeof relatedEntities.CONTENT[1] !== 'undefined') relationObj["end_name"] = relatedEntities.CONTENT[1]["ENTITY-RELATION"];
                                                    if(typeof relatedEntities.CONTENT[2] !== 'undefined') relationObj["association_type"] = relatedEntities.CONTENT[2]["ENTITY-RELATION"];
                                                    if(typeof relatedEntities.CONTENT[3] !== 'undefined') relationObj["multiplicity"] = relatedEntities.CONTENT[3]["ENTITY-RELATION"];
                                                }

                                                if(!associationTracer[entity.ENTITY][relatedEntities.CONSIDERATIONS] || Object.keys(associationTracer[entity.ENTITY][relatedEntities.CONSIDERATIONS]).length==0){
                                                    associationTracer[entity.ENTITY][relatedEntities.CONSIDERATIONS] = relationObj;   //{ "name": "nombre", "aggregation": "none---shared---composite", "multiplicity": "0..1 -- 1 -- 0..* -- 1..* -- *"}
                                                }

                                            });
                                        }
                                    }
                                    });
                                }
                                });
                            }
                        });
                        }
                        
                    });
                    }
                });
                }
            });
            }
        }
    );

    for(var classKey in associationTracer){

        var sameEntity = (element) => element.entity == classKey;
        var index = classes.findIndex(sameEntity);
        var entityTailClassView = classes[index].classview;

        for(var classKey2 in associationTracer[classKey]){
            var sameEntity = (element) => element.entity == classKey2;
            index = classes.findIndex(sameEntity);
            if(index>-1){    
                var entityHeadClassView = classes[index].classview;
                var sameAssociation = (element) => ((element.tail == entityHeadClassView) && (element.head == entityTailClassView));
                index = associations.findIndex(sameAssociation);
                var association_name = "";
                var end_name = "";
                var association_type = "";
                var multiplicity = "";

                if(associationTracer[classKey][classKey2] !== null ){
                    if(associationTracer[classKey][classKey2].hasOwnProperty("association_name")) association_name = associationTracer[classKey][classKey2]["association_name"];
                    if(associationTracer[classKey][classKey2].hasOwnProperty("end_name")) end_name = associationTracer[classKey][classKey2]["end_name"];
                    if(associationTracer[classKey][classKey2].hasOwnProperty("association_type")) association_type = associationTracer[classKey][classKey2]["association_type"];
                    if(associationTracer[classKey][classKey2].hasOwnProperty("multiplicity")) multiplicity = associationTracer[classKey][classKey2]["multiplicity"];

                    if(index==-1){
                        associations.push(create_association(diagram, entityTailClassView, entityHeadClassView, association_name, end_name, multiplicity, association_type)); 
                    } else {
                        update_association(associations[index], association_name, end_name, multiplicity, association_type);
                    }
                }

                // if(associationTracer[classKey][classKey2] !== null && index==-1){  //associationTracer[classKey][classKey2] && index==-1
                //     associations.push(create_association(diagram, entityTailClassView, entityHeadClassView)); //, name, multiplicity, aggregation
                // } else if(associationTracer[classKey][classKey2] !== null && index>1){
                //     update_association(associations[index]);
                // }

            } 
                //app.engine.setProperty(temp1.model.end1, "name", "aasds");
                //temp1.nameLabel.model.name
            
        }
    }

}



/**
 * 
 * Load from file
 *
 * @param {string} filename
 * @return {$.Promise}
 */
function loadFromFile (filename) {

    
    fs.readFile(filename, 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
        obj = JSON.parse(data); //now it an object
        create_diagram(obj);
    }});

}

exports.loadFromFile = loadFromFile