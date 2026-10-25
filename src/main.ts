import './style.css'

// --- Canvas setup ---

// Find the <div id="app"> in your HTML
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('App container missing')

// Create a new HTML <canvas> element.
const canvas = document.createElement('canvas')
// Set its drawing dimensions
canvas.width = 480
canvas.height = 640
// Put the canvas inside the div
app.replaceChildren(canvas)
// Create a container for the game buttons.
const controls = document.createElement('div')
controls.className = 'controls'

// Create the Pause button.
const pauseButton = document.createElement('button')
pauseButton.type = 'button'
pauseButton.textContent = '⏸'
pauseButton.setAttribute('aria-label', 'Pause game')
pauseButton.title = 'Pause game'

// Create the Restart button.
const restartButton = document.createElement('button')
restartButton.type = 'button'
restartButton.textContent = '↻'
restartButton.setAttribute('aria-label', 'Restart game')
restartButton.title = 'Restart game'

// Place both buttons underneath the canvas.
controls.append(pauseButton, restartButton)
app.append(controls)

// --- Start screen ---

// Hide the game controls until the game starts.
controls.hidden = true

const cover = document.createElement('section')
cover.className = 'start-screen'
cover.setAttribute('aria-labelledby', 'game-title')

const coverTitle = document.createElement('h1')
coverTitle.id = 'game-title'
coverTitle.textContent = 'Dodge the Blocks'

const coverDescription = document.createElement('p')
coverDescription.textContent =
  'Dodge the falling blocks. Earn points. See how far you can go.'

const coverInstructions = document.createElement('p')
coverInstructions.className = 'start-instructions'
coverInstructions.textContent = 'Move with ← → or A / D'

const startButton = document.createElement('button')
startButton.type = 'button'
startButton.textContent = '▶ Start'
// Optional player name field.
const nameLabel = document.createElement('label')
nameLabel.htmlFor = 'player-name'
nameLabel.textContent = 'Player name (optional)'

const nameInput = document.createElement('input')
nameInput.id = 'player-name'
nameInput.type = 'text'
nameInput.maxLength = 20
nameInput.placeholder = 'Leave blank for a random name'
nameInput.autocomplete = 'off'
// Keep the name field hidden until Start is clicked.
nameLabel.hidden = true
nameInput.hidden = true

// Allow Enter to activate Play while typing a name.
nameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault()
    startButton.click()
  }
})

cover.append(
  coverTitle,
  coverDescription,
  coverInstructions,
  nameLabel,
  nameInput,
  startButton,
)
app.append(cover)

// Allow focus to move to the game after pressing Start.
canvas.tabIndex = -1
canvas.setAttribute('aria-label', 'Dodge the Blocks playing field')

startButton.addEventListener('click', () => {
    // First click: reveal the name field without starting the game.
  if (nameInput.hidden) {
    nameLabel.hidden = false
    nameInput.hidden = false
    startButton.textContent = '▶ Play'
    nameInput.focus()
    return
  }
  // Use the entered name, or generate one if the field is blank.
  playerName = nameInput.value.trim().slice(0, 20) || randomPlayerName()
  nameInput.value = playerName
  bestScore = loadBestScore()
  hasStarted = true
  cover.remove()
  controls.hidden = false
  restart()
  canvas.focus()
})

startButton.focus()

// --- Collision results popup ---

// A dialog is a built-in HTML popup.
const resultDialog = document.createElement('dialog')
resultDialog.className = 'result-dialog'
resultDialog.setAttribute('aria-labelledby', 'result-title')
resultDialog.setAttribute('aria-describedby', 'result-summary')

const resultTitle = document.createElement('h2')
resultTitle.id = 'result-title'
resultTitle.textContent = 'Game over'

const resultSummary = document.createElement('p')
resultSummary.id = 'result-summary'

const playAgainButton = document.createElement('button')
playAgainButton.type = 'button'
playAgainButton.textContent = '↻ Restart'

resultDialog.append(resultTitle, resultSummary, playAgainButton)
app.append(resultDialog)

playAgainButton.addEventListener('click', () => {
  restart()
})

// Add a second option to the collision popup.
const homeButton = document.createElement('button')
homeButton.type = 'button'
homeButton.textContent = 'Back Home'
homeButton.className = 'home-button'
resultDialog.append(homeButton)

homeButton.addEventListener('click', () => {
  // Reset the round and close the results popup.
  restart()

  // Stop gameplay and hide the game controls.
  hasStarted = false
  controls.hidden = true
  // Return the cover to its initial state.
  nameLabel.hidden = true
  nameInput.hidden = true
  startButton.textContent = '▶ Start'

  // Put the existing cover back into the page.
  app.append(cover)
  startButton.focus()
})

// Keep the results visible until the player chooses Restart.
resultDialog.addEventListener('cancel', (event) => {
  event.preventDefault()
})

// --- Player ---

// Describes the player object and its properties. In this case, the player is a square that can move left and right.
const player = {
  x: 220,
  y: 560,
  width: 40,
  height: 40,
  color: '#38bdf8',
}

const speed = 250 // Pixels per second.
let gameOver = false
let isPaused = false // Tracks whether the player paused the game.
let score = 0 // Number of obstacles successfully dodged.
let hasStarted = false // Tracks whether the cover has been dismissed.
// --- Player identity and saved scores ---

let playerName = ''
let bestScore = 0

function randomPlayerName(): string {
  const adjectives = ['Neon', 'Swift', 'Cosmic', 'Lucky']
  const animals = ['Fox', 'Panda', 'Falcon', 'Otter']

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const number = Math.floor(Math.random() * 9000) + 1000

  return `${adjective}${animal}-${number}`
}

function scoreStorageKey(): string {
  // Names differing only in capitalisation share the same best score.
  return `dodge-the-blocks:best:${playerName.toLowerCase()}`
}

function loadBestScore(): number {
  try {
    const saved = Number(localStorage.getItem(scoreStorageKey()))
    return Number.isSafeInteger(saved) && saved >= 0 ? saved : 0
  } catch {
    // The game can still run if browser storage is unavailable.
    return 0
  }
}

function saveBestScore() {
  if (score <= bestScore) return

  bestScore = score

  try {
    localStorage.setItem(scoreStorageKey(), String(bestScore))
  } catch {
    // Keep the best score in memory for this session.
  }
}

// --- Keyboard input ---

// This line remembers which keys are currently pressed. This is used to move the player left and right.
const keys = new Set<string>() // 'Set' stores unique values to check a key was pressed without duplicates.

window.addEventListener('keydown', (event) => { //This adds a listener for a DOWN key pressing event.
    // Allow normal typing and cursor movement on the cover.
  if (!hasStarted || gameOver) return
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()  // Stops the browser’s default action for left and right, which is to scroll the page.
  }

  keys.add(event.key.toLowerCase()) // Adds and converts into lowecase the stored key to 'const=keys' above
})

window.addEventListener('keyup', (event) => { // Same listener for UP key press event
  keys.delete(event.key.toLowerCase()) // This removes the key form the 'const=keys' above when the key is released 
})

// Prevent stuck movement when switching tabs.
window.addEventListener('blur', () => { // This is triggered when the window looses focus, switching to another tab or app.
  keys.clear() // This clears the 'const=keys' above so the player stops moving when the player is not in focus
})

// --- Obstacles ---

type Obstacle = { // Describes the obstacles falling from the top of the screen. 
  x: number // Each obstacle has a position (x and y) and a size (w and h). 
  y: number
  width: number
  height: number
}

let obstacles: Obstacle[] = [] // This is an array '[]' that stores the obstacles that are currently on screen. 
let spawnTimer = 0 // This is a timer that counts how long has been since the last obstacle was created. When the interval is reached, a new obstacle is spawned and the timer resets.

const baseSpawnInterval = 1 // Seconds between obstacles.
const baseFallSpeed = 180 // Pixels per second.
function getLevel(): number {
  // Gain a level every 5 points, up to level 10.
  return Math.min(10, Math.floor(score / 5) + 1)
}

function spawnObstacle(index: number, count: number) { // This 'function' creates a new obstacle at a random possition in the canvas and adds it to the [] array of obstacles.
  const size = 40 // This defines the w and h of the obtacle to 40 pixels, making this a square.

  // Give each block its own horizontal section.
  const sectionWidth = canvas.width / count
  const margin = 12 // Leave space on both sides of each section.

  obstacles.push({ // This script adds/pushes a new obstacle created to the array
    x: index * sectionWidth + margin + Math.random() * (sectionWidth - size - margin * 2), // This generates the random position for the obstacle according to the canvas and adds a limit/border
    y: -size,
    width: size,
    height: size,
  })
}

function overlaps(a: Obstacle, b: Obstacle): boolean { // This function checks it the player has collided with an obstacle by checking the the squares are overlapping. 
  return ( // Returns true if the squares are overlpped, false if its not
    a.x < b.x + b.width && // This checks the LEFT side 
    a.x + a.width > b.x && // This checks the RIGHT side
    a.y < b.y + b.height && // This checks the TOP side 
    a.y + a.height > b.y // This checks the BOTTOM side 
  )
}

// --- Game controls ---

function pause() {
  isPaused = true
  keys.clear()
  pauseButton.textContent = 'Resume'
    pauseButton.textContent = '▶'
  pauseButton.setAttribute('aria-label', 'Resume game')
  pauseButton.title = 'Resume game'
}

function resume() {
  isPaused = false
  keys.clear()
  previousTime = performance.now()
  pauseButton.textContent = 'Pause'
  pauseButton.textContent = '⏸'
  pauseButton.setAttribute('aria-label', 'Pause game')
  pauseButton.title = 'Pause game'
}

function restart() {
    // Close the results popup and restore the pause control.
  resultDialog.close()
  pauseButton.disabled = false
  // Return the player to the starting position.
  player.x = (canvas.width - player.width) / 2
  player.y = 560

  // Clear the previous round.
  obstacles = []
  spawnTimer = 0
  gameOver = false
  collisionTimer = 0 // Clear the effect when restarting manually.
  score = 0 // Every new round starts with zero points.

  // Restart always begins a running game, even if it was paused.
  resume()
}

pauseButton.addEventListener('click', () => {
  if (isPaused) {
    resume()
  } else {
    pause()
  }
})

restartButton.addEventListener('click', () => {
  restart()
})

const collisionDuration = 0.4 // Seconds before automatic restart.
let collisionTimer = 0 // Remaining time for the collision effect.

// --- Update game positions ---

function update(deltaTime: number) { // This function updates the game according of the time passed since the last movement and the key pressed. Also creates the obstacles and checks for collisions.
    if (!hasStarted) return // Wait for the player to press Start.
    if (isPaused) return // Skip movement and spawning while paused.

  if (gameOver) {
    // Count down before starting the next round.
    collisionTimer = Math.max(0, collisionTimer - deltaTime)

    if (collisionTimer === 0) {
    //  restart() // This calls the restart() function to reset the game
    }

    return // If the game is over, the function stops running
  }
  
  // Calculate difficulty from the current score.
  const level = getLevel()
  const fallSpeed = baseFallSpeed + (level - 1) * 20
  const spawnInterval = baseSpawnInterval - (level - 1) * 0.05
  // Increase the number of blocks per spawn, up to four.
  const obstaclesPerSpawn = Math.min(level, 4)
  let direction = 0 // This var stores the direction of the player, 0 means no movement, -1 is left, 1 is right, up and down are blocked.

  if (keys.has('arrowleft') || keys.has('a')) direction -= 1  // Checks if left or A is pressed, if so the direction is set to -1
  if (keys.has('arrowright') || keys.has('d')) direction += 1 // Checks if left or A is pressed, if so the direction is set to +1

  player.x += direction * speed * deltaTime // This updates the player position according to the direction, speed and time passed since last movement

  // Keep the player inside the playing field.
  player.x = Math.max( // This checks the borders of the canvas and keeps the player inside
    0,
    Math.min(canvas.width - player.width, player.x),
  )

  // Create an obstacle each time the timer reaches the interval.
  spawnTimer += deltaTime // This uses deltaTime to count how much time passed and adds it to the spawnTimer

if (spawnTimer >= spawnInterval) { // This checks if the spawnInterval has been reached,
  // if yes then call the spawnObstacle() function to create a new obstacle
  // Create multiple obstacles each time the spawn timer is ready.
  for (let i = 0; i < obstaclesPerSpawn; i++) {
    spawnObstacle(i, obstaclesPerSpawn) // if yes then call the spawnObstacle() function to create a new obstacle
  }
  spawnTimer -= spawnInterval // and resets the spawnTimer=0
}

  // Move obstacles down.
  for (const obstacle of obstacles) { // This is the loop definition that checks the array of obstacles and moves them accordingly
    obstacle.y += fallSpeed * deltaTime // This is the actual movement of the obstacles and uses fallSpeed and deltaTime to move it down the screen

    if (overlaps(player, obstacle)) { // This checks if the player has collided
      gameOver = true //If yes, then set the gameOver var to TURE 
            collisionTimer = collisionDuration
      keys.clear()
            // Show the final score before it gets reset.
      resultSummary.textContent = `You scored ${score} point(s) on Level ${getLevel()}`
      resultSummary.textContent = `${playerName}, you scored ${score} points on level ${getLevel()}. Best: ${bestScore}.`
      pauseButton.disabled = true
      resultDialog.showModal()
      playAgainButton.focus()
      return // This stops the game if the gameOver is TRUE
    }
  }
  // Award one point for each obstacle that has left the screen.
  for (const obstacle of obstacles) {
    if (obstacle.y >= canvas.height) {
      score += 1
      saveBestScore()
    }
  }

  // Remove obstacles that have left the screen.
  obstacles = obstacles.filter( // This removed the obscatle from the array if the position is below the canvas h and w
    (obstacle) => obstacle.y < canvas.height, // This is the filter function that looks the position and returns true or false
  )
}

// --- Draw the scene ---

function draw() { // This function draws the game scene: background, player and obstacles
  const context = canvas.getContext('2d') // This sets the context of a 2D canvas
  if (!context) return // This returns if the context is not set, to avoid errors

  // Background.
  context.save()

  // Blend from dark blue at the top to almost black at the bottom.
  const gradient = context.createLinearGradient(
    0, 0,
    0, canvas.height,
  )
  gradient.addColorStop(0, '#101d35')
  gradient.addColorStop(1, '#030712')

  context.fillStyle = gradient // This sets the background to a specific color
  context.fillRect(0, 0, canvas.width, canvas.height) // This draws the background rectangle for the layoutof the game

  // Draw a faint grid behind the player and obstacles.
  const gridSize = 40
  context.strokeStyle = 'rgba(56, 189, 248, 0.07)'
  context.lineWidth = 1
  context.beginPath()

  // Vertical lines.
  for (let x = gridSize; x < canvas.width; x += gridSize) {
    context.moveTo(x, 0)
    context.lineTo(x, canvas.height)
  }

  // Horizontal lines.
  for (let y = gridSize; y < canvas.height; y += gridSize) {
    context.moveTo(0, y)
    context.lineTo(canvas.width, y)
  }

  context.stroke()
  context.restore()

  // Player.
  context.save() // Remember the current drawing settings.

  context.fillStyle = player.color // This sets the color to the player color defined above
  context.shadowColor = player.color
  context.shadowBlur = 14 // Controls how soft and wide the glow looks.

  // Create a rounded rectangle, then paint it.
  context.beginPath()
  context.roundRect( // This draws the player rectangle accrording to the position and size defined above
    player.x,
    player.y,
    player.width,
    player.height,
    6, // Corner radius in pixels.
  )
  context.fill()

  // Draw a bright outline without adding another glow.
  context.shadowBlur = 0
  context.strokeStyle = '#bae6fd'
  context.lineWidth = 2
  context.stroke()

  context.restore() // Restore settings so other objects don't glow.

  // --- Draw obstacles ---
  context.save()

  context.fillStyle = '#a11b2f' // This sets the color of the obstacle
  context.strokeStyle = '#fb7185' // A lighter red outline.
  context.lineWidth = 2

  for (const obstacle of obstacles) { // This is the loop definition that checks the array of obstacle
    context.beginPath()

    context.roundRect( // and draws them accordingly
      obstacle.x,
      obstacle.y,
      obstacle.width,
      obstacle.height,
      4, // Slightly rounded corners.
    )

    context.fill()
    context.stroke()

    // Draw a small highlight inside the top edge.
    context.beginPath()
    context.moveTo(obstacle.x + 8, obstacle.y + 8)
    context.lineTo(
      obstacle.x + obstacle.width - 8,
      obstacle.y + 8,
    )
    context.stroke()
  }

  context.restore()

  // Show a fading red flash after a collision.
  if (gameOver) {
    context.save()
    const opacity = 0.3 * (collisionTimer / collisionDuration)
    context.fillStyle = `rgba(255, 70, 90, ${opacity})`
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.restore()
  }

  // Draw the score last so it appears above the obstacles.
  context.fillStyle = '#ffffff'
  context.font = 'bold 20px system-ui'
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillText(`Points: ${score}`, 24, 34)

  // Show the difficulty level below the score.
  context.font = '14px system-ui'
  context.fillText(`Level: ${getLevel()}`, 24, 64)
  context.fillText(`Player: ${playerName}`, 24, 88, 260)
  context.fillText(`Best: ${bestScore}`, 24, 110)
}

// --- Game loop ---

let previousTime = performance.now() // This sets the previousTime to miliseconds since the page was loaded

function gameLoop(currentTime: number) { // This is the main loop script that runs the game
  // Convert milliseconds to seconds; limit jumps after a pause.
  const deltaTime = Math.min( // this avoids big jumps in the game when the blur is triggered
    (currentTime - previousTime) / 1000, // This converts the miliseconds to seconds
    0.05, // This limits the deltaTime to 0.5 to avoid the big jumps
  )

  previousTime = currentTime // This sets the previousTime to the currentTime to be used in the next loop

  update(deltaTime) // This calls the update function to update the positions according to deltaTime and key pressed
  draw() // This calls the draw function to draw the scene according to the updated positions

  requestAnimationFrame(gameLoop) // This calls the gameLoop function again to create a loop
} 

requestAnimationFrame(gameLoop) // This starts the game loop by calling gameLoop by passing the current time in miliseconds since the page has been loaded.