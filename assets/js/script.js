import { bagOfWords, documentAsTree, 
         stopWords, contextModel, 
         loadBagOfWords, loadDocumentAsTree, 
         loadStopWords, loadContextModel} from './readModelData.js'; 


async function displayDocumentTree() {
    if (!documentAsTree) {
        console.log("document tree not yet loaded, loading now...");
        await loadDocumentAsTree(); // Ensure it's loaded before proceeding
    }
    if (documentAsTree) {
        for (const [key, value] of Object.entries(documentAsTree)) {
            const element = key;
            const jsonObject = value;
            if (jsonObject) {
                const elementType = jsonObject['type']
                const elementText = jsonObject['text']
                //console.log(key, elementType)
                //console.log(elementText)
            } 
        }
    } else {
        console.warn("documentAsTree is not available.");
    }
}


const calculateSimilarity = (query, embedding) => {
  const queryWords = query.toLowerCase().split(/\s+/);
  const totalWords = queryWords.length;
  //console.log('queryWords: ', queryWords)
  //console.log('embdding: ', embedding)
  
  if (totalWords === 0) return 0;
  
  const score = queryWords.reduce((sum, word) => 
    sum + (embedding[word] || 0), 
    0
  );
  
  return score / totalWords;
};


async function evaluateContext(selectedWords) {

    let relatedLeafs = [];

    const cosineSimilarity = (selectedWords, chunk) => {
        const totalWords = selectedWords.length;
        if (totalWords ===0) {return 0;}
        const score = selectedWords.reduce((sum, word) =>
            sum + (chunk[word] || 0), 0
        );
        return score/totalWords;
    }

    if (!contextModel) {
        console.log("Context model not yet loaded, loading now...");
        await loadContextModel(); // Ensure it's loaded before proceeding
    }
    if (contextModel) {
        for (const leaf of contextModel) {
            if (leaf && Array.isArray(leaf.textChunks)) {
                for (const textChunk of leaf.textChunks) {
                    const chunkId = textChunk.chunkId
                    const chunk = textChunk.chunk
                    const similarity = cosineSimilarity(selectedWords, chunk)
                    if (similarity > 0) {
                        const tmpDict = {'pathName': leaf.pathName,
                                         'chunkId': chunkId, 
                                         'score': similarity}
                        relatedLeafs.push(tmpDict)
                    }
                }
            }
        }
    } else {
        console.warn("documentAsTree is not available.");
    }
    return relatedLeafs;
}


async function getVectorToSearch(textToSearch) {
    const regexPattern1 = /[\u0300-\u036f]/g;
    const regexPattern2 = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    const regexPattern3 = /\s+/g;
    const cleanTextStep1 = textToSearch.toLowerCase().normalize("NFD").replace(regexPattern1, '')
    const cleanTextStep2 = cleanTextStep1.toLowerCase().replace(regexPattern2, ' ')
    const cleanText = cleanTextStep2.replace(regexPattern3, ' ').trim()
    const words = cleanText.split(' ').filter(Boolean)
    //
    if (!stopWords) {
        await loadStopWords(); // Ensure it's loaded before proceeding
    }
    if (stopWords) {
        let nonStopWords = [];
        const stopWordsSet = new Set(stopWords);
        nonStopWords.push(... words.filter(word => !stopWordsSet.has(word)))
        if (nonStopWords.length >=1) {
            if (!bagOfWords) {
                await loadBagOfWords();
            }
            if (bagOfWords) {
                let selectedWords = [];
                const bagOfWordsKeys = Object.keys(bagOfWords)
                const bagOfWordsSet = new Set(bagOfWordsKeys)
                selectedWords.push(... nonStopWords.filter(word => bagOfWordsSet.has(word)))
                if (selectedWords.length >= 1) {
                    return selectedWords;
                } else {
                    return null;
                }
            }
        }
    }
}

async function getRelatedLeafs(selectedWords, numTextChunks) {
    let topNResults = null;
    const relatedLeafs =  await evaluateContext(selectedWords);
    if (relatedLeafs) {
        const groupedByPath = {}
        for (const leaf of relatedLeafs) {
            const path = leaf.pathName;
            if (!groupedByPath[path]) {
                groupedByPath[path] = {
                    chunksIds: new Set(),
                    totalScore: 0,
                    entryCount: 0,
                    maxScore: - Infinity
                };
            }

            const group = groupedByPath[path];

            if (!group.chunksIds.has(leaf.chunkId)) {
                group.chunksIds.add(leaf.chunkId);
                group.totalScore += leaf.score;
                group.entryCount ++;
                if (leaf.score>group.maxScore) {
                    group.maxScore = leaf.score;
                }
            }
        }

        const result = Object.entries(groupedByPath).map(([pathName, data]) => {
            const avgScore = data.totalScore / data.entryCount;
            const maxScore = data.maxScore;
            const weightedAvg = ((2 * maxScore) + avgScore)/3;

            return {
                pathName,
                numChunks: data.chunksIds.size,
                avgScore: avgScore,
                maxScore: maxScore,
                weightedAvg: weightedAvg
            };

        });

        if (result) {
            if (result.length >=1) {

                result.sort((a, b) => {
                    if (b.weightedAvg !== a.weightedAvg) {
                        return b.weightedAvg - a.weightedAvg
                    }
                    return b.numChunks - a.numChunks;
                });
                //console.log(result)
                topNResults = result.slice(0, numTextChunks)
                return topNResults
            }
        } else {
            return null;
        }
    } else {
        return null;
    }
}

async function getResponsePaths(topNResults) {
    const responsePaths = []
    let m = 1;
    for (const result of topNResults) {
        let resultStructure = Array(8).fill('')
        const pathParts = result.pathName.split('/')
        if (pathParts) {
            for (let n = 1; n < pathParts.length; n++) {
                if (n > 1) {
                    resultStructure[n-1] = resultStructure[n-2] + '/' + pathParts[n]
                } else {
                    resultStructure[n-1] = '/' + pathParts[n]
                }
            }
            responsePaths.push(resultStructure)
        }
        m +=1
    }
    return responsePaths
}


async function getHTMLResponse(responsePaths) {
    if (responsePaths.length >=1) {
        let htmlResponse = '';
        for (let m = 0; m < responsePaths.length; m++) {
            for (let n = 1; n < responsePaths[m].length; n++) {
                const currentPath = responsePaths[m][n];
                if (currentPath !== '') {
                    let currentNodeText = '';
                    let tmpTreeNodeText = '';
                    const currentPathParts = currentPath.split('/')
                    const tmpTreeNodeLabel = currentPathParts.at(-1)
                    //
                    if (!documentAsTree) {
                        await loadDocumentAsTree();
                    }
                    if (documentAsTree) {
                        if (currentPath in documentAsTree) {
                            tmpTreeNodeText = documentAsTree[currentPath].text;
                        } 
                    }
                    //
                    if (tmpTreeNodeLabel !== 'accion' && tmpTreeNodeLabel !== 'U') {
                        switch (n) {
                            case 1:
                                currentNodeText = `<h3><b>Capitulo ${tmpTreeNodeLabel}</b> - ${tmpTreeNodeText} </h3>\n`;
                                break;
                            case 2:
                                currentNodeText = `<h4><b>Seccion ${tmpTreeNodeLabel}</b> - ${tmpTreeNodeText}</h4>\n`;
                                break;
                            case 3:
                                currentNodeText = `<p><b>Articulo ${tmpTreeNodeLabel}</b>: ${tmpTreeNodeText}</p>\n`;
                                break;
                            case 4:
                                currentNodeText = `<p style="padding-left:20px;"><b>${tmpTreeNodeLabel}</b> - ${tmpTreeNodeText}</p>\n`;
                                break;
                            case 5:
                                currentNodeText = `<p style="padding-left:40px;"><b>${tmpTreeNodeLabel}</b> ${tmpTreeNodeText})</p>\n`;
                                break;
                            case 6:
                                currentNodeText = `<p style="padding-left:60px;"><b>${tmpTreeNodeLabel}</b> \n${tmpTreeNodeText})</p>\n`;
                                break;
                            default:
                                currentNodeText = `${tmpTreeNodeText}}<br>\n`;
                                break
                        }
                    } else {
                        if (tmpTreeNodeLabel === 'accion') {
                            currentNodeText = `<p><i>${tmpTreeNodeText}}</i></p>\n`;
                        }
                        if (tmpTreeNodeLabel == 'U') {
                            currentNodeText = '\n'
                        }
                    }
                    htmlResponse += currentNodeText
                }
            }
            htmlResponse += '<br>'
        }
        return htmlResponse;
    }
    return null;
}


async function addMessageToChat(message, sender) {
    //console.log(`received message ${message} from ${sender}`)
    let formatedMessage = '';
    const newMessageDiv = document.createElement('div')
    if (sender === 'user') {
        formatedMessage = `<p><strong>usuario:</strong> ${message}</p>`
        newMessageDiv.className = 'message-bubble user-message' 
        newMessageDiv.style = 'background-color: #dddddd; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;'
    }
    if (sender === 'bot') {
        formatedMessage = `<p><strong>Agente:</strong>  Con fundamento en:</p>\n${message}`
        newMessageDiv.className = 'message-bubble bot-message' 
        newMessageDiv.style = 'background-color: #e6f7ff; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;';
    }
    if (sender === 'warning') {
        formatedMessage = `<p><strong>Agente:</strong>${message}:</p>`
        newMessageDiv.className = 'message-bubble bot-message' 
        newMessageDiv.style = 'background-color: #f8ed62; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;';
    }
    if (sender === 'error') {
        formatedMessage = `<p><strong>Agente:</strong>${message}:</p>`
        newMessageDiv.className = 'message-bubble bot-message' 
        newMessageDiv.style = 'background-color: #f69697; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.5rem;';
    }
    newMessageDiv.innerHTML = formatedMessage;
    //console.log(newMessageDiv.innerHTML)
    chatContainer.appendChild(newMessageDiv)
    newMessageDiv.scrollIntoView({behavior: 'smooth', block:'end'})
    userInput.value = '';
}

async function sendMessage() {
    const textToSearch = userInput.value.trim();
    if (textToSearch !== '') {
        //console.log(textToSearch)
        const selectedWords = await getVectorToSearch(textToSearch)
        if (selectedWords !== null) {
            if (selectedWords.length >=3) {
                addMessageToChat(textToSearch, 'user')

                const numTextChunks = document.getElementById('maxChunks');
                //
                const topNResults = await getRelatedLeafs(selectedWords, numTextChunks.value)
                const responsePaths = await getResponsePaths(topNResults);
                const htmlResponse = await getHTMLResponse(responsePaths)
                addMessageToChat(htmlResponse, 'bot')
            } else {
                addMessageToChat('Para darte mejores resultados, necesito más detalles en tu pregunta. Por favor, añade un poco más de contexto', 'warning')
                userInput.value = '';
            }
        } else {
            addMessageToChat(`Su consula "<strong>${textToSearch}"</strong>, no esta relacionada con los alcances de este chatbot`, 'error')
            userInput.value = '';
        }
    }
}


// --- Footer Time Update ---
const currentTimeSpan = document.getElementById('currentTime');

function updateLocalTime() {
    const options = {
        timeZone: 'America/Mazatlan',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    };
    const culiacanTime = new Date().toLocaleTimeString('en-US', options);
    currentTimeSpan.textContent = culiacanTime;
}
// Update time immediately and then every second
updateLocalTime();
setInterval(updateLocalTime, 1000);

//
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const maxChunksInput = document.getElementById('maxChunks');
const queryExamples = document.querySelectorAll('.example-btn')
if (queryExamples.length >=1) {
    queryExamples.forEach(buttonElement => {
        buttonElement.addEventListener('click', (event) => {
            userInput.value = buttonElement.dataset.query;
            sendMessage()
        });
    });
};

//
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

