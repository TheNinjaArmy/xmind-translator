const niveles_t = {
    2: "SYSTEM",
    5: "PROCESS",
    8: "REQUIREMENTS",
    11: "REQUIREMENT",
    14: "ENTITIES",
    17: "ENTITY",
    20: "ATTRIBUTES",
    23: "ATTRIBUTE",
    26: "CONSIDERATIONS",
    29: ""
};

const niveles_valores = {
    2: [""],
    5: [""],
    8: ["requerimientos" ,"requirements", "definición de requerimientos", "necesidades", "requerimientos / receta / diagnostico", "requisitos"],
    11: [""],
    14: ["entidades","entities"],
    17: [""],
    20: ["atributos", "características", "propiedades", "rasgos", "characteristics", "aspects", "properties", "traits"],
    23: [""],
    26: [""],                                                                                                                                                 //"Nombre", "Name", "Descripción", "Description", "Tipo de dato", "Date type", "Consideraciones", "Considerations"
    29: [""],
    32: [""]
};

const similarity_rate = {
    2: 0,
    5: 0,
    8: 0.5,
    11: 0, 
    14: 0.5,
    17: 0,
    20: 0.5, 
    23: 0,
    26: 0,  //0.5
    29: 0,
    32: 0
};

exports.niveles_t = niveles_t
exports.niveles_valores = niveles_valores
exports.similarity_rate = similarity_rate