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
  const messageClass = `message-${uniqueId}`;
  const wrapper = document.createElement("div");
  wrapper.className = `wrapper ${isAi && "ai"}`;

  const chat = document.createElement("div");
  chat.className = "chat";

  const profile = document.createElement("div");
  profile.className = "profile";

  const img = document.createElement("img");
  img.src = isAi ? bot : user;
  img.alt = isAi ? "bot" : "user";
  profile.appendChild(img);

  const message = document.createElement("div");
  message.className = `message ${messageClass}`;
  message.id = uniqueId;
  message.innerText = value;

  chat.appendChild(profile);
  chat.appendChild(message);

  wrapper.appendChild(chat);

  // Scroll to the bottom of the chat box when a new message is added
  const chatBox = document.querySelector(".chat-box");
  const isScrolledToBottom =
    chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop + 1;

  chatBox.appendChild(wrapper);

  if (isScrolledToBottom) {
    chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
  }
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  
  // user's chatstripe
  chatStripe(false, data.get('prompt'), generateUniqueId());
  // to clear the textarea input
  form.reset();
  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatStripe(true, '...', uniqueId);
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

      // Scroll to the latest message only if it's a bot message
      if (messageDiv.classList.contains('ai')) {
        messageDiv.scrollIntoView();
      }
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
