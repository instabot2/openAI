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
  element.scrollTop = 0;
  let index = 0;
  const typingSpeed = 20; // set typing speed here
  const intervalId = setInterval(() => {
    if (index < text.length) {
      element.insertAdjacentHTML('beforeend', text.charAt(index));
      index++;
      // Check if the element is already scrolled to the bottom and scroll it up
      if (element.scrollHeight - element.scrollTop === element.clientHeight) {
        element.scrollTop = element.scrollHeight;
        // Check if the bot typing animation has reached the bottom of the browser and give an alert
        if (element.scrollTop === 0) {
          alert('Bot typing reached the bottom of the browser!');
        }
      }
    } else {
      clearInterval(intervalId);
      // Add this code to scroll to the new message
      const isMessageWrapperAtBottom = messageWrapper.scrollHeight - messageWrapper.clientHeight <= messageWrapper.scrollTop + 1;
      const isChatContainerAtBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 1;
      if (isMessageWrapperAtBottom && isChatContainerAtBottom) {
        setTimeout(() => {
          const messageDiv = messageWrapper.lastChild;
          messageDiv.scrollIntoView();
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      } else if (isMessageWrapperAtBottom) {
        setTimeout(() => {
          const messageDiv = messageWrapper.lastChild;
          messageDiv.scrollIntoView();
        }, 100);
      }
      // call the callback function when typing animation is finished
      setTimeout(() => callback && callback(), text.length * typingSpeed);
    }
  }, typingSpeed);

  // Add this code to give an alert when the messageWrapper is resized to the bottom of the browser
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      if (entry.target.scrollHeight - entry.target.clientHeight <= entry.target.scrollTop + 1) {
        alert('Message wrapper resized to the bottom of the browser!');
      }
    }
  });

  resizeObserver.observe(element);
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

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // Retrieve stored messages from local storage
  const messages = JSON.parse(localStorage.getItem('messages')) || [];

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
      typeText(messageDiv, parsedData, () => {
        // Add this code to scroll up to the new message and display it on top of the browser
        const previousMessageDivsHeight = Array.from(messageWrapper.children).reduce((acc, cur) => acc + cur.offsetHeight, 0);
        chatContainer.scrollTop = previousMessageDivsHeight - chatContainer.offsetHeight;
        // scroll to the new message
        scrollIntoView(messageDiv);

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
};



form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
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
