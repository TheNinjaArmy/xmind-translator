const xmllector = require('./xml-reader')
const jsonlector = require('./json-reader')

const XMIND_FILE_FILTERS = [
  {name: 'XMind Files', extensions: ['xmind']},
  {name: 'All Files', extensions: ['*']}
];

const JSON_FILE_FILTERS = [
  {name: 'JSON Files', extensions: ['json']},
  {name: 'All Files', extensions: ['*']}
];

function handleShowMessage () {
    window.alert('Hello, world!')
    
    ////////////////////////ESPACIO PARA PROBAR CODIGO////////////////////////////////

    var project = app.project.getProject()
    var model = project.ownedElements[0]
    console.log(project.ownedElements)


    ////////////////////////ESPACIO PARA PROBAR CODIGO////////////////////////////////



    console.log(app.factory.getDiagramIds());
}

function importarArchivoXMind (fullPath) {
  // window.alert('mensaje marcador -importarArchivoXMind-')
    if (fullPath) {
        xmllector.loadFromFile(fullPath)
    } else {
        var files = app.dialogs.showOpenDialog('Select a XMIND File (.xmind)', null, XMIND_FILE_FILTERS)
        if (files && files.length > 0) {
            try {
                xmllector.loadFromFile(files[0])
            } catch (err) {
                app.dialogs.showErrorDialog('Failed to load the file.', err)
                console.log(err)
            }
        }
    }
}

function abrirArchivoJSON (fullPath) {
  // window.alert('mensaje marcador -abrirArchivoJSON-')
    if (fullPath) {
        jsonlector.loadFromFile(fullPath)
    } else {
        var files = app.dialogs.showOpenDialog('Select a JSON File (.json)', null, JSON_FILE_FILTERS)
        if (files && files.length > 0) {
            try {
                jsonlector.loadFromFile(files[0])
            } catch (err) {
                app.dialogs.showErrorDialog('Failed to load the file.', err)
                console.log(err)
            }
        }
    }
}

function init () {
    app.commands.register('xmind:hello-world', handleShowMessage)
    app.commands.register('xmind:importar-xmind', importarArchivoXMind)
    app.commands.register('xmind:abrir-json', abrirArchivoJSON)
}

exports.init = init
