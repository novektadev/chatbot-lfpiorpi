const stopWords = [];

async function loadStopWords() {
    const data =  ['a', 'al', 'algo', 'algunas', 'algunos', 'ambos', 'ambas',
                   'ante', 'antes', 'aquel', 'aquella', 'aquellas', 'aquellos', 
                   'aqui', 'asi', 'aun', 'bajo', 'bien', 'cabe', 'cada', 'casi', 
                   'cierto', 'ciertas', 'ciertos', 'como', 'con', 'conmigo', 'consigo', 
                   'contigo', 'contra', 'cual', 'cuales', 'cualquier', 'cuando', 'cuanto', 
                   'cuanta', 'cuantas', 'cuantos', 'de', 'del', 'demas', 'demasiado', 
                   'demasiada', 'demasiados', 'demasiadas', 'dentro', 'desde', 'donde', 
                   'dos', 'e', 'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'es', 
                   'esa', 'esas', 'ese', 'esos', 'esta', 'estas', 'este', 'estos', 'esta', 
                   'estan', 'estar', 'estaba', 'estaban', 'estamos', 'este', 'estoy', 'excepto', 
                   'fin', 'fue', 'fueron', 'fui', 'fuimos', 'ha', 'hacia', 'hace', 'hacen', 
                   'hacer', 'hacemos', 'haces', 'hago', 'han', 'hasta', 'hay', 'haya', 
                   'he', 'hemos', 'hola', 'hoy', 'la', 'las', 'le', 'les', 'lo', 'los', 
                   'mal', 'mas', 'mas', 'me', 'menos', 'mi', 'mio', 'mia', 'mios', 'mias', 
                   'mis', 'mucho', 'mucha', 'muchos', 'muchas', 'muy', 'nada', 'nadie', 
                   'ni', 'ningun', 'ninguna', 'ningunos', 'ningunas', 'no', 'nos', 'nosotras', 
                   'nosotros', 'nuestra', 'nuestras', 'nuestro', 'nuestros', 'nunca', 'o', 'os', 
                   'otra', 'otras', 'otro', 'otros', 'para', 'parecer', 'pero', 'poca', 
                   'pocas', 'poco', 'pocos', 'poder', 'podemos', 'puede', 'pueden', 'puedo', 
                   'por', 'que', 'que', 'quien', 'quienes', 'quiza', 'quizas', 'sabe', 
                   'saben', 'sabes', 'segun', 'ser', 'si', 'siempre', 'siendo', 'sin', 
                   'sino', 'sobre', 'somos', 'soy', 'su', 'sus', 'suyo', 'suya', 'suyos', 
                   'suyas', 'tal', 'tales', 'tambien', 'tampoco', 'tan', 'tanto', 'tanta', 
                   'tantos', 'tantas', 'te', 'teneis', 'tenemos', 'tengo', 'ti', 'tiempo', 
                   'tiene', 'tienen', 'toda', 'todas', 'todo', 'todos', 'toma', 'tambien', 
                   'tras', 'tu', 'tus', 'u', 'un', 'una', 'unos', 'unas', 'usted', 'ustedes', 
                   'va', 'vamos', 'van', 'vaya','verdad', 'verdadera', 'verdadero', 'vosotras', 
                   'vosotros', 'voy', 'y', 'ya', 'yo']
    
    stopWords.length = 0;
    stopWords.push(...data)
}

export {stopWords, loadStopWords };

loadStopWords()

