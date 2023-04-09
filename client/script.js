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

function typeText(element, text, callback) {
  let index = 0;
  const intervalId = setInterval(() => {
    if (index < text.length) {
      element.insertAdjacentHTML('beforeend', text.charAt(index));
      index++;
      // Check if the element is already scrolled to the bottom and scroll it up
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        element.scrollTop = element.scrollHeight;
      }
    } else {
      clearInterval(intervalId);
      if (callback) {
        callback();
      }
    }
  }, 20);
  // Add this line to clear the text before typing
  element.innerHTML = '';
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




const xmlSerializer = new XMLSerializer();
const parser = new DOMParser();
const xmlFileName = 'chat_history.xml';
let xmlFile = null;

const createXmlFile = () => {
  const xmlString = xmlSerializer.serializeToString(parser.parseFromString('<messages></messages>', 'text/xml'));
  const blob = new Blob([xmlString], { type: 'text/xml' });
  xmlFile = new File([blob], xmlFileName, { type: 'text/xml' });
};

const appendMessageToXmlFile = (isBot, message) => {
  const xmlString = xmlSerializer.serializeToString(parser.parseFromString(`<message><isBot>${isBot}</isBot><text>${message}</text></message>`, 'text/xml'));
  const blob = new Blob([xmlString], { type: 'text/xml' });
  const reader = new FileReader();
  reader.readAsText(blob);
  reader.onloadend = () => {
    const messageNode = parser.parseFromString(reader.result, 'text/xml').firstChild;
    const messagesNode = parser.parseFromString(xmlFile.text, 'text/xml').firstChild;
    messagesNode.appendChild(messageNode);
    xmlFile = new File([messagesNode], xmlFileName, { type: 'text/xml' });
    localStorage.setItem(xmlFileName, xmlSerializer.serializeToString(messagesNode));
  };
};

const loadXmlFile = () => {
  const xmlString = localStorage.getItem(xmlFileName);
  if (xmlString) {
    xmlFile = new File([xmlString], xmlFileName, { type: 'text/xml' });
  } else {
    createXmlFile();
    localStorage.setItem(xmlFileName, xmlSerializer.serializeToString(xmlFile));
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  const messages = JSON.parse(localStorage.getItem('messages')) || [];

  // Clear existing chat messages
  messageWrapper.innerHTML = '';

  // user's chatstripe
  const userMessage = chatStripe(false, data.get('prompt'));
  messageWrapper.insertAdjacentHTML('beforeend', userMessage);

  // to clear the textarea input
  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botMessage = chatStripe(true, '', uniqueId);
  messageWrapper.insertAdjacentHTML('beforeend', botMessage);

  // specific message div
  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  // scroll to the top of the chat container to show the new message
  //chatContainer.scrollTop = 0;

  try {
    const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.get('prompt'),
        xmlMessages: messages.filter((message) => message.isXML).map((message) => message.message),
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim(); // trims any trailing spaces/'\n'
      typeText(messageDiv, parsedData, () => {
        // scroll to the new message
        scrollIntoView(messageDiv);

        // scroll to the top of the chat container to show the new message
        chatContainer.scrollTop = 0;

        // Store the message in local storage
        messages.push({ isBot: true, message: parsedData });
        localStorage.setItem('messages', JSON.stringify(messages));
      });
    } else {
      const err = await response.text();
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    messageDiv.innerHTML = err.message;
    console.error(err);
  }

  // Store the user's message in local storage
  messages.push({ isBot: false, message: data.get('prompt') });
  localStorage.setItem('messages', JSON.stringify(messages));

  // Summarize previous messages and display
  const previousMessages = messages.filter((message) => !message.isBot).map((message) => message.message);
  const summarizedMessages = await summarizeMessages(previousMessages);
  setSummary(summarizedMessages);
};

  



const getMessagesFromCache = () => {
  // Retrieve messages from browser cache or local storage
  const cachedMessages = localStorage.getItem('cachedMessages');
  return cachedMessages ? JSON.parse(cachedMessages) : [];
};

const summarizeMessages = async () => {
  const messages = getMessagesFromCache();

  if (messages.length === 0) {
    window.alert('No messages found');
    return '';
  }

  // Limit the number of messages to 10
  const truncatedMessages = messages.slice(0, 10);
  // Truncate each message to the first 50 characters
  const truncatedAndFormattedMessages = truncatedMessages.map((message) => message.slice(0, 50) + '...');

  const prompt = `Please summarize the following messages:\n\n${truncatedAndFormattedMessages.join('\n')}\n`;
  try {
    const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.summary === undefined) {
        window.alert('Summary data not found');
        throw new Error(`Summary data not found`);
      }
      const summary = data.summary.trim();
      window.alert('Summarization successful! 2');
      window.alert(`Captured message: ${summary}`);
      return summary;
    } else {
      const err = await response.text();
      window.alert(`Captured error: ${err}`);
      throw new Error(`Error ${response.status}: ${err}`);
    }
  } catch (err) {
    console.error(err);
    window.alert(`Summarization failed: ${err}`);
    return '';
  }
};





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

