import botSvg from './assets/bot.svg';
import userSvg from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

function loader(element) {
  element.textContent = '';
  const loadInterval = setInterval(() => {
    // Update the text content of the loading indicator
    element.textContent += '.';
    // If the loading indicator has reached three dots, reset it
    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
  return loadInterval;
}

function typeText(element, text) {
  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
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

function chatStripe(isAi, value, uniqueId) {
  // Create the chat stripe
  const chatStripe = `
    <div class="wrapper ${isAi ? 'ai' : ''} auto-scroll">
      <div class="chat">
        <div class="profile">
          <img src=${isAi ? botSvg : userSvg} alt="${isAi ? 'bot' : 'user'}"/>
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
  `;

  return chatStripe;
}

// Function to scroll the chat container to the bottom
function scrollToBottom() {
  const chatContainer = document.querySelector('.chat-container');
  // Only scroll to the bottom if the chat container has the 'auto-scroll' class
  if (chatContainer.classList.contains('auto-scroll')) {
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Check if the user has manually scrolled up the chat container
    const scrollDiff = chatContainer.scrollTop + chatContainer.offsetHeight - chatContainer.scrollHeight;
    if (scrollDiff < 0) {
      // The user has scrolled up, so remove the 'auto-scroll' class
      chatContainer.classList.remove('auto-scroll');
    }
  }
}

async function handleSubmit(e) {
  e.preventDefault();

  const data = new FormData(form);
  // user's chatstripe
  const userChatStripe = chatStripe(false, data.get('prompt'), generateUniqueId());
  addNewMessage(userChatStripe);
  // to clear the textarea input
  form.reset();
  // bot's chatstripe
  const uniqueId = generateUniqueId();
  const botChatStripe = chatStripe(true, ' ', uniqueId);
  addNewMessage(botChatStripe);
  // specific message div
  const messageDiv = document.getElementById(uniqueId);
  loader(messageDiv);

  try {
    const response = await fetch('https://chatgpt-ai-lujs.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.get('prompt'),
      }),
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim(); // trims any trailing spaces/'\n'
      typeText(messageDiv, parsedData);
      // scroll to the latest message
      scrollToBottom();

    } else {
      const err = await response.text();
      messageDiv.innerHTML = `Error: ${err}`;
    }
  } catch (err) {
    messageDiv.innerHTML = `Something went wrong: ${err}`;
    console.error(err);
  }

  // focus scroll to the bottom again
  scrollToBottom();
}; 


form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
