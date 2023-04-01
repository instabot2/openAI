import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

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

function typeText(element, text) {
  let index = 0;
  let interval = setInterval(() => {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

const messageWrapper = document.getElementById('message_wrapper');

function displayMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageWrapper.appendChild(messageElement); // append the new message to the end
  messageWrapper.scrollTo(0, 0); // scroll to the top
}

function addMessage(value, isAi) {
  const messageWrapper = document.getElementById('message_wrapper');
  const uniqueId = Date.now();

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('wrapper', isAi && 'ai');

  const chatDiv = document.createElement('div');
  chatDiv.classList.add('chat');

  const profileDiv = document.createElement('div');
  profileDiv.classList.add('profile');

  const profileImg = document.createElement('img');
  profileImg.src = isAi ? bot : user;
  profileImg.alt = isAi ? 'bot' : 'user';

  const messageContent = document.createElement('div');
  messageContent.classList.add('message');
  messageContent.id = uniqueId;
  messageContent.textContent = value;

  profileDiv.appendChild(profileImg);
  chatDiv.appendChild(profileDiv);
  chatDiv.appendChild(messageContent);
  messageDiv.appendChild(chatDiv);
  messageWrapper.appendChild(messageDiv);

  // Scroll to the bottom of the message wrapper
  messageWrapper.scrollTop = messageWrapper.scrollHeight;
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

function handleSubmit(e) {
  e.preventDefault();

  const data = new FormData(form);
  // user's chatstripe
  addMessage(data.get('prompt'), false);
  // to clear the textarea input
  form.reset();
  // bot's chatstripe
  const uniqueId =


const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  // user's chatstripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));
  // to clear the textarea input
  form.reset();
  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, ' ', uniqueId);
  // specific message div
  const messageDiv = document.getElementById(uniqueId);
  // messageDiv.innerHTML = '...'
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
      // focus on the latest message
      messageDiv.scrollIntoView();
      // scroll up to see new messages
      chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
    } else {
      const err = await response.text();
      messageDiv.innerHTML = `Error: ${err}`;
    }
  } catch (err) {
    messageDiv.innerHTML = `Something went wrong: ${err}`;
    console.error(err);
  }

  // focus scroll to the bottom again
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

  
form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});
