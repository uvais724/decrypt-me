import './App.css'
import React from 'react';

function App() {
  const alphabets = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'];
  const message = "I FEEL DEEPLY CONNECTED WHEN WE TALK HONESTLY."
  const chars = message.split("");
  const cryptogramArray = [];
  const cryptogramMap = new Map();
  let lastFocusedInput = null;

  function getRandomFromValidPool(min, max, excludeArray) {
    const pool = [];
    for (let i = min; i <= max; i++) {
      if (!excludeArray.includes(i)) {
        pool.push(i);
      }
    }

    // If no numbers are left in the pool, return null or handle error
    if (pool.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }


  const generateCryptoGramValue = () => {
    for (const char of chars) {
      const random = getRandomFromValidPool(1, 26, Array.from(cryptogramMap.values()));
      const regex = new RegExp('[A-Z]+');

      if (regex.test(char)) {
        cryptogramMap.set(char, random);
      }
    }
  };

  generateCryptoGramValue();

  console.log("Char map: ", cryptogramMap);

  function pickRandomCharsWithIndex(chars, count) {
    if (count > chars.length) {
      throw new Error("Count cannot be greater than list length");
    }
    const regexForSingleChar = new RegExp('[A-Z]');
    const indices = chars.map((_, i) => {
      if (regexForSingleChar.test(_)) {
        return i;
      }
    }).filter(i => i);

    // Fisher–Yates shuffle on indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return indices.slice(0, count).map(i => ({
      index: i,
      value: chars[i]
    }));
  }

  const randomChars = pickRandomCharsWithIndex(chars, 3);
  console.log("Random characters: ", randomChars);

  for (let i = 0; i < chars.length; i++) {
    const cryptogram = {};
    cryptogram.letter = chars[i];
    cryptogram.index = i;
    cryptogram.value = cryptogramMap.get(chars[i]);
    const revealed = randomChars.filter(rc => rc.index == i && rc.value == chars[i]);
    if (revealed.length > 0)
      cryptogram.revealed = true;

    cryptogramArray.push(cryptogram);
  }

  console.log('Cryptogram Array: ', cryptogramArray);

  function checkInput(e, lastFocusedInput) {
    const inputId = e ? e.target.id : lastFocusedInput.id;
    const inputValue = e ? e.target.value : lastFocusedInput.value;
    const foundLetter = cryptogramArray.filter(c => c.index == inputId && c.letter.toUpperCase() === inputValue.toUpperCase()).map(c => c.letter.toUpperCase());
    const allInputs = document.querySelectorAll('.maskedInput');

    if (foundLetter.length > 0) {
      e ? e.target.disabled = true : lastFocusedInput.disabled = true;
      e ? e.target.classList.add('correct-answer') : lastFocusedInput.classList.add('correct-answer');
      moveToNextInput(inputId, [...allInputs]);
    }
  }

  function moveToNextInput(currentInputId, inputList) {
    const maxInputId = Math.max(...inputList.map(input => parseInt(input.id)));
    for (let i of inputList) {
      if (parseInt(i.id) <= maxInputId && parseInt(i.id) > parseInt(currentInputId) && !i.disabled) {
        i.focus();
        break;
      }
    }
  }

  function updateLastFocus() {
    lastFocusedInput = document.activeElement;
  }

  function inputLetter(e) {
    console.log('Last active element: ', lastFocusedInput.id);
    const buttonValue = e.target.innerText;
    console.log('Button Value: ', buttonValue);
    lastFocusedInput.value = buttonValue;
    checkInput(undefined, lastFocusedInput)

  }

  return (
    <>
      <div className='container flex justify-self-center border-4 border-blue-300 p-10 mt-10'>
        <div className='flex flex-col justify-between gap-10'>
          <div className='flex justify-center flex-wrap my-5'>
            {cryptogramArray.map((item, index) => (
              item.letter === ' ' || !/[A-Z]/.test(item.letter) ? (
                <span className={`text-4xl py-0  ${item.letter === ' ' ? 'px-4' : ''}`} key={index}>{item.letter}</span>
              ) : (
                <div key={`container-${index}`} className='flex flex-col gap-2'>
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    className={`maskedInput w-8 h-8 text-center border border-gray-300 mx-1 ${item.revealed ? 'correct-answer' : ''} uppercase`}
                    id={index}
                    value={item.revealed ? item.letter : undefined}
                    defaultValue={!item.revealed ? '' : undefined}
                    disabled={item.revealed}
                    onChange={checkInput}
                    onFocus={updateLastFocus}
                  />
                  <p className='w-8 h-8 text-center mx-1'>{item.value}</p>
                </div>
              )
            ))}
          </div>
          <div className='flex justify-center flex-wrap gap-3'>
            {alphabets.map((item, index) => (
              <React.Fragment key={index}>
                <button className='border-2 border-blue-300 text-center wx-4 px-4 py-2 cursor-pointer text-blue-500 hover:bg-blue-500 hover:text-white' onClick={inputLetter}>{item}</button>
                {(item === 'P' || item === 'L') && (
                  <div className="w-full" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
