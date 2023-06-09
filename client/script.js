import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');
const messageWrapper = document.querySelector('#message_wrapper');

let loadInterval;

function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';
    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}


// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function scrollIntoView(element, behavior = 'smooth', block = 'start') {
  element.scrollIntoView({
    behavior,
    block,
  });
}


function typeText(element, text, callback, searchResults) {
  const intervalTime = 20; // Set the interval time in milliseconds
  const cursorSymbol = '&#x258B;'; // Set the cursor symbol to a block character
  const cursorIntervalTime = 500; // Set the interval time for the cursor blink
  const spaces = '&nbsp;'; // Two non-breaking space entities
  let index = 0;
  let showCursor = false;
  element.innerHTML = ''; // Clear the text before typing

  function updateText() {
    if (index < text.length) {
      element.insertAdjacentHTML('beforeend', text.charAt(index));
      index++;
      // Check if the element is already scrolled to the bottom and scroll it up
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        element.scrollTop = element.scrollHeight;
      }
      showCursor = !showCursor;
      const cursorHtml = `<span style="font-size: 0.8em;">${showCursor ? cursorSymbol : ''}</span>`;
      element.innerHTML = `${text.substring(0, index)}${spaces}${cursorHtml}`;
      setTimeout(updateText, intervalTime);
    } else {
      showCursor = true;
      setTimeout(updateCursor, cursorIntervalTime);

      // Display search results after typing text
      if (searchResults) {
        const searchResultMessages = searchResults.map((result) => {
          return chatStripe(true, `Title: ${result.title}<br>Link: ${result.link}<br>Description: ${result.description}`);
        });
        element.insertAdjacentHTML('beforeend', searchResultMessages.join(''));
      }
      if (callback) {
        callback();
      }
    }
  }

  function updateCursor() {
    showCursor = !showCursor;
    const cursorHtml = `<span style="font-size: 0.8em;">${showCursor ? cursorSymbol : ''}</span>`;
    element.innerHTML = `${text}${spaces}${cursorHtml}`;
    setTimeout(updateCursor, cursorIntervalTime);
  }
  setTimeout(updateText, intervalTime);
}


function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi && 'ai'}">
      <div class="chat">
        <div class="profile">
          <img src=${isAi ? bot : user} alt="${isAi ? 'bot' : 'user'}"/>
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
  `;
}

  
function loadData(queryString) {
  const encodedQuery = encodeURIComponent(queryString.replace(/\%0A$/, '').trim());
  //window.alert(`The string: ${JSON.stringify(encodedQuery)}`);
  //const encodedQuery = "market today";
  const apiUrl = `https://content.guardianapis.com/search?q=${encodedQuery}&api-key=35831ef2-e9cf-4977-b5ef-00856e0563c9`;  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const dataDiv = document.getElementById('dataDiv');
      
      // Clear any existing data from the div
      dataDiv.innerHTML = '';
      
      // Iterate over each article returned by the API
      data.response.results.forEach(article => {
        
        // Create a new div for this article's content
        const articleDiv = document.createElement('div');
        articleDiv.classList.add('article');
        
        // Create a heading element for the article title
        const heading = document.createElement('h3');
        heading.textContent = article.webTitle;
        
        // Create a paragraph element for the section and publication date
        const meta = document.createElement('p');
        meta.textContent = `${article.sectionName} | ${new Date(article.webPublicationDate).toLocaleDateString()}`;
        
        // Store the meta text content in localStorage
        const NewsUpdate = JSON.parse(localStorage.getItem('metaTextContent')) || [];
        NewsUpdate.push(meta.textContent);
        localStorage.setItem('metaTextContent', JSON.stringify(NewsUpdate));

        
        // Create a paragraph element for the article content
        //const content = document.createElement('p');
        //content.textContent = article.fields.bodyText;   
        
        // Add the heading, meta, and content elements to the article div
        articleDiv.appendChild(heading);
        articleDiv.appendChild(meta);
        //articleDiv.appendChild(content);
        
        // Add the article div to the data div
        dataDiv.appendChild(articleDiv);
      });
      
      // Display the data div
      dataDiv.style.display = 'block';
    });
}
       


let conversationHistory = [];

const handleSubmit = async (e) => {
  e.preventDefault();
  
  //hidden text
  hiddenText.style.display = "none";
  
  // Retrieve prompt string from form data
  const data = new FormData(form);

  // Call the loadData function to fetch data from the Guardian API
  loadData(data.get('prompt'));

  // Retrieve stored messages from local storage
  const oldMessages = JSON.parse(localStorage.getItem('messages')) || [];
  //window.alert(`The old messages are: ${JSON.stringify(oldMessages)}`);
  
  // Retrieve stored newsupdate from local storage
  //const NewsUpdate = JSON.parse(localStorage.getItem('metaTextContent')) || [];
  //NewsUpdate.push(meta.textContent);
  //localStorage.setItem('metaTextContent', JSON.stringify(NewsUpdate));

  
  
  
  // Add user message to conversation history
  const userMessage = { isBot: false, message: data.get('prompt') };
  conversationHistory.push(userMessage);
  //window.alert(`current conversationHistory: ${JSON.stringify(conversationHistory)}`);

  // Clear existing chat messages
  messageWrapper.innerHTML = '';
  
  // user's chatstripe
  const userChatStripe = chatStripe(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userChatStripe);

  // to clear the textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botChatStripe = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botChatStripe);

  // specific message div
  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  //window.alert(`NewsUpdate: ${JSON.stringify(NewsUpdate)}`);
  
  
  try {   
    
    //modify this code-----------------
    //alert('Start Request..');
    //const data = {
    //  conversationHistory: conversationHistory,
    //  prompt: conversationHistory.map((msg) => msg.message).join('\n') + '\n' + data.get('prompt'),
    //}; 
    //const options = {
    //  method: 'POST',
    //  url: 'https://chatgpt-api7.p.rapidapi.com/ask',
    //  headers: {
    //    'content-type': 'application/json',
    //    'X-RapidAPI-Key': '9ec25d2accmsha2f4b9a8bf1feccp12fd72jsn7fa8b52e09eb',
    //    'X-RapidAPI-Host': 'chatgpt-api7.p.rapidapi.com',
    //  },
    //  data: JSON.stringify(data),
    //};

    const response = await fetch('https://chatgpt-api7.p.rapidapi.com/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': '9ec25d2accmsha2f4b9a8bf1feccp12fd72jsn7fa8b52e09eb',
        'X-RapidAPI-Host': 'chatgpt-api7.p.rapidapi.com',
      },

    //const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
    //  method: 'POST',
    //  headers: {
    //    'Content-Type': 'application/json',
    //  },
      body: JSON.stringify({
        conversationHistory: conversationHistory,
        prompt: conversationHistory.map((msg) => msg.message).join('\n') + '\n' + data.get('prompt'),
      }),
    }); 

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {

      //modify code
      // Alert message on success
      alert('Request successful');
      //const responseData = await axios.request(options);
      //const { conversation_id, response: botResponse } = responseData;

      
      const responseData = await response.json();
      const parsedData = responseData.bot.trim(); // trims any trailing spaces/'\n'

      // Add bot message to conversation history
      const botMessage = { isBot: true, message: parsedData };
      conversationHistory.push(botMessage);
      //window.alert(`Writing botMessage conversationHistory: ${JSON.stringify(conversationHistory)}`);
      
      typeText(messageDiv, parsedData, () => {
        // scroll to the new message
        scrollIntoView(messageDiv);

        // scroll to the top of the chat container to show the new message
        chatContainer.scrollTop = 0;

        // Store the new message in local storage
        const newMessage = { isBot: true, message: parsedData };
        const messages = [...oldMessages, newMessage];
        localStorage.setItem('messages', JSON.stringify(messages));

        // Write the messages to an XML file
        try {
          const messagesXml = messages
            .filter((message) => message.isBot)
            .map((message) => `<message isBot="true">${message.message}</message>`)
            .join('');
          const messageXml = `<messages>${messagesXml}</messages>`;
          console.log(`Writing messages to file: ${messageXml}`);
          //window.alert(`Writing messages to file: ${JSON.stringify(messageXml)}`);
          //write Message To File
          //writeMessageToFile(true, messageXml);
          
        } catch (err) {
          console.error(err);
        }
      });

      console.log('responseData:', responseData);

      // Combine conversation history with new messages received from the server
      const newMessages = responseData?.conversationHistory || [];
      conversationHistory.push(...newMessages);
      // Update conversation history in local storage
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
      // Update the UI with the new messages
      updateConversationHistory(conversationHistory);
      console.log('Conversation history has been updated!', conversationHistory);
      //window.alert(`Conversation history has been updated with new data: ${JSON.stringify(newMessages)}`);

    } else {
      console.error(`Response status: ${response.status}`);
            
      // Display an error message to the user
      if (response.status === 400) {
        const errorMessage = `
          <div style="background-color: rgb(240, 128, 128); padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <p>Oops! Looks like you've hit the usage limit of the free OpenAI API key. Please upgrade to a paid plan to continue using the service.</p>
            <p>Note: Refreshing the page will erase all memory and start a new conversation.</p>
            <button id="refresh-button">Refresh</button>
          </div>
        `;
        messageWrapper.insertAdjacentHTML('beforeend', errorMessage);
        // Add click event listener to refresh button
        const refreshButton = document.getElementById('refresh-button');
        refreshButton.addEventListener('click', handleRefresh);
      } else {
        const errorMessage = chatStripe(true, `Something went wrong. Error code: ${response.status}`, uniqueId);
        messageWrapper.insertAdjacentHTML('beforeend', errorMessage);
      }

      
    }
  } catch (err) {
    console.error(err);
  }
};

// Define the handleRefresh function
function handleRefresh() {
  location.reload();
}




function writeMessageToFile(isBot, messageXml) {
  if (!isBot) return; // Only save bot messages

  const fileName = 'bot_messages.xml';
  const file = new Blob([messageXml], { type: 'text/xml' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = fileName;

  a.addEventListener('error', function () {
    console.error('Error downloading file');
    alert('Error downloading file');
  });

  if (navigator.userAgentData?.platform === 'android') {
    // Use Android-specific method to download file
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const base64Data = fileReader.result.split(',')[1];
      const intent = window.Android.createIntent({
        action: 'android.intent.action.VIEW',
        type: 'text/xml',
        data: `data:text/xml;base64,${base64Data}`,
        flags: ['FLAG_GRANT_READ_URI_PERMISSION', 'FLAG_GRANT_WRITE_URI_PERMISSION'],
      });
      window.Android.startActivity(intent);
    };
    fileReader.readAsDataURL(file);
  } else {
    // Use default download method for other devices
    document.body.appendChild(a); // Add the link to the DOM
    a.click();
    document.body.removeChild(a); // Remove the link from the DOM
    URL.revokeObjectURL(url);
  }

  // Save the file to the "memory" array
  const memory = JSON.parse(localStorage.getItem('memory') || '[]');
  const existingFileIndex = memory.findIndex((file) => file.fileName === fileName);
  if (existingFileIndex > -1) {
    // If the file already exists in memory, update its URL
    memory[existingFileIndex].url = url;
  } else {
    // Otherwise, add the new file to the memory array
    memory.push({ fileName, url });
  }
  localStorage.setItem('memory', JSON.stringify(memory));
}



const hiddenText = document.getElementById("hidden_text");
const textarea = document.querySelector("textarea");
const body = document.querySelector("body");

document.addEventListener('keydown', (e) => {
  textarea.focus();
});

function handleBodyClick(event) {
  if (event.target !== textarea && event.target !== hiddenText) {
    hiddenText.style.display = "none";
    // body.classList.remove("blur");
  } else {
    hiddenText.style.display = "block";
    // body.classList.add("blur");
    if (event.target === textarea) {
      textarea.focus();
    }
  }
}

function handleTextareaInput() {
  if (textarea.value.trim() === '') {
    hiddenText.style.display = "none";
  } else {
    hiddenText.style.display = "block";
    hiddenText.textContent = textarea.value;
    //body.classList.add("blur");
    hiddenText.classList.remove("blur");
    textarea.focus();
  }
}

function handleHiddenTextInput() {
  textarea.value = hiddenText.textContent;
  textarea.focus();
}

// Add event listeners
textarea.addEventListener("focus", handleBodyClick);
textarea.addEventListener("input", handleTextareaInput);
hiddenText.addEventListener("input", handleHiddenTextInput);
body.addEventListener("click", handleBodyClick);



chatContainer.addEventListener('scroll', () => {
  try {
    const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop === chatContainer.clientHeight;
    if (isAtBottom) {
      //alert('You have reached the end of the chat.');
    }
  } catch (error) {
    console.error('Error checking if at bottom of chat container:', error);
    //alert('Error checking if at bottom of chat container.');
  }
});

window.addEventListener('resize', () => {
  // check if user has scrolled up before resizing
  const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
  // calculate new scroll position after resizing
  const newScrollTop = (chatContainer.scrollHeight - chatContainer.clientHeight) * (chatContainer.scrollTop / (chatContainer.scrollHeight - chatContainer.clientHeight));
  // set chat container height to its current height
  chatContainer.style.height = `${chatContainer.clientHeight}px`;
  // scroll to the bottom of the chat container if user is already at the bottom
  if (isScrolledToBottom) {
    chatContainer.scrollTop = newScrollTop;
    //chatContainer.scrollTop = 0;
  }
  // if user has scrolled up, keep their scroll position after resizing
  else {
    chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight - (1 - (newScrollTop / chatContainer.clientHeight)) * (chatContainer.scrollHeight - chatContainer.clientHeight);
  }
});

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
