'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout {
  Date = new Date();
  id = (Date.now() + ' ').slice(-10);

  constructor(Distance, Duration, Coords) {
    this.distance = Distance;
    this.duration = Duration;
    this.coords = Coords;
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.Date.getMonth()]
    } ${this.Date.getDate()}`;
  }
}

class Running extends workout {
  type = 'running';
  constructor(Distance, Duration, Cadence, Coords) {
    super(Distance, Duration, Coords);
    this.cadence = Cadence;
    this._calcPace();
    this._setDescription();
  }
  _calcPace() {
    return (this.pace = this.distance / this.duration);
  }
}

class Cycling extends workout {
  type = 'cycling';
  constructor(Distance, Duration, Elevation, Coords) {
    super(Distance, Duration, Coords);
    this.elevation = Elevation;
    this._calcSpeed();
    this._setDescription();
  }
  _calcSpeed() {
    return this.speed = this.distance / (this.duration/60);
  }
}

class App {
  #workouts=[]
  #mapEvent;
  #map;
  #mapSetview=13
  constructor() {
    this._getPossition();

    this._getLocalStorage()

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click',this._moveToPopup.bind(this))

    containerWorkouts.addEventListener('click',this._delete.bind(this))
    
  }
  _getPossition() {
    navigator.geolocation.getCurrentPosition(
      this._LoadMap.bind(this),
      function (err) {
        console.error(err);
      }
    );
  }
  _LoadMap(possition) {
    const { latitude: lat, longitude: lng } = possition.coords;

    this.#map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);
    this.#workouts.forEach(work=>this._renderMarkup(work))
    this.#map.on('click', this._showForm.bind(this));
  }
  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    let { lat, lng } = this.#mapEvent.latlng;
    const validInput = (...input) => input.every(inp => Number.isFinite(inp));
    
    e.preventDefault();
    const Distance = +inputDistance.value;
    const Duration = +inputDuration.value;
    let workout;
    if (inputType.value === 'running') {
      const Cadence = +inputCadence.value;

      if (!validInput(Distance, Duration, Cadence))
        return alert('Please enter valid information !');

      workout = new Running(Distance, Duration, Cadence, [lat, lng]);
    }

    if (inputType.value === 'cycling') {
      const Elevation = +inputElevation.value;
      if (!validInput(Distance, Duration, Elevation))
        return alert('Please enter valid information !');

      workout = new Cycling(Distance, Duration, Elevation, [lat, lng]);
    }

    this.#workouts.push(workout)

    this._renderWorkout(workout);

    this._renderMarkup(workout)

    this._hideForm();

    this._setLocalStorage()

    
  }
  _setLocalStorage(){
      localStorage.setItem('workout',JSON.stringify(this.#workouts))
  }


  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      
    `;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        <!----<button class="edit-btn">Edit</button>---->
        <button class="del-btn" data-id="${workout.id}">Delete</button>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevation}</span>
          <span class="workout__unit">spm</span>
        </div>
        
        <!----<button class="edit-btn">Edit</button>---->
        <button class="del-btn" data-id="${workout.id}">Delete</button>
      </li>
      `;
    }
    
   form.insertAdjacentHTML('afterend', html);
  }
  _renderMarkup(workout){
    const [lat,lng]=workout.coords
    L.marker(workout.coords)
    .addTo(this.#map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,

        closeOnClick: false,
        autoClose: false,
        className: `${workout.type}-popup`,
      })
    )
    .setPopupContent(
      `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
    )
    .openPopup();
  }
  _hideForm() {
    inputDistance.value =
    inputDuration.value =
    inputElevation.value =
    inputCadence.value =
      '';
     form.style.display='none'
     form.classList.add('hidden')
     setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _moveToPopup(e){
    const workoutEl=e.target.closest('.workout')
    if(!workoutEl) return
    const workout=this.#workouts.find(work=>work.id===workoutEl.dataset.id)

    this.#map.setView(workout.coords, this.#mapSetview, {
      animate: true,
      pan: { duration: 1 },
    });

  }
  _delete(e){
     const deleteBtn=e.target.closest('.del-btn')
     if(!deleteBtn) return 
     const index=this.#workouts.findIndex(work=>work.id===deleteBtn.dataset.id)
     this.#workouts.splice(index,1)
     this._setLocalStorage()
     window.top.location = window.top.location
  }
  _getLocalStorage() {
    const data=JSON.parse(localStorage.getItem('workout'))
    if(!data) return
    this.#workouts=data
    this.#workouts.forEach(work=>this._renderWorkout(work))
   

  }
}
const app = new App();



