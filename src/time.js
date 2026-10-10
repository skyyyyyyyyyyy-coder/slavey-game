import { events } from './events.js';

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const DAYS_PER_SEASON = 28;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const SECONDS_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE; // 86,400s

/**
 * Authoritative Central In-Game Clock and Calendar Manager
 * Default: 24 real minutes = 1 in-game day (timeScale = 60.0 in-game seconds per real second)
 * Starts at 08:00 AM on Spring Day 1, Year 1
 */
export class TimeManager {
  constructor(options = {}) {
    this.timeScale = options.timeScale !== undefined ? options.timeScale : 60.0;
    this.isPaused = false;

    // Calendar state
    this.year = options.year || 1;
    this.seasonIndex = options.seasonIndex !== undefined ? options.seasonIndex : 0; // 0 = Spring
    this.day = options.day || 1; // 1 to 28

    // Clock state - starts at 08:00 AM (28,800 in-game seconds into the day)
    this.hour = options.hour !== undefined ? options.hour : 8;
    this.minute = options.minute !== undefined ? options.minute : 0;
    this.second = options.second !== undefined ? options.second : 0;

    // Total in-game seconds elapsed since game start
    this.totalInGameSeconds = this.calculateTotalSeconds();

    this.lastEmittedMinute = -1;
    this.lastEmittedHour = -1;
  }

  get season() {
    return SEASONS[this.seasonIndex];
  }

  calculateTotalSeconds() {
    const dayInSeason = this.day - 1;
    const totalDays = ((this.year - 1) * SEASONS.length + this.seasonIndex) * DAYS_PER_SEASON + dayInSeason;
    const secondsInCurrentDay = this.hour * 3600 + this.minute * 60 + this.second;
    return totalDays * SECONDS_PER_DAY + secondsInCurrentDay;
  }

  /**
   * Normalized time of day from 0.0 (midnight) to 1.0 (next midnight)
   * 0.00 = 00:00 (Midnight)
   * 0.25 = 06:00 (Dawn)
   * 0.50 = 12:00 (Noon)
   * 0.75 = 18:00 (Dusk)
   */
  get normalizedDayTime() {
    const secondsToday = this.hour * 3600 + this.minute * 60 + this.second;
    return secondsToday / SECONDS_PER_DAY;
  }

  /**
   * Human readable day phase
   */
  get dayPhase() {
    const h = this.hour + this.minute / 60;
    if (h >= 5.0 && h < 7.0) return 'dawn';
    if (h >= 7.0 && h < 11.5) return 'morning';
    if (h >= 11.5 && h < 16.5) return 'midday';
    if (h >= 16.5 && h < 19.5) return 'sunset';
    if (h >= 19.5 && h < 21.0) return 'dusk';
    return 'night';
  }

  /**
   * Day/Night phase description icon
   */
  get phaseIcon() {
    switch (this.dayPhase) {
      case 'dawn': return '🌅';
      case 'morning': return '☀️';
      case 'midday': return '🌤️';
      case 'sunset': return '🌇';
      case 'dusk': return '🌆';
      default: return '🌙';
    }
  }

  /**
   * Advance time by real-world delta seconds
   * @param {number} deltaRealSeconds 
   */
  update(deltaRealSeconds) {
    if (this.isPaused || this.timeScale <= 0) return;

    const inGameSecondsDelta = deltaRealSeconds * this.timeScale;
    this.totalInGameSeconds += inGameSecondsDelta;

    this.second += inGameSecondsDelta;
    while (this.second >= 60) {
      this.second -= 60;
      this.minute += 1;

      if (this.minute >= 60) {
        this.minute = 0;
        this.hour += 1;

        if (this.hour >= 24) {
          this.hour = 0;
          this.advanceDay();
        }

        events.emit('time:hour_changed', {
          hour: this.hour,
          day: this.day,
          season: this.season,
          year: this.year
        });
      }
    }

    // Emit tick if minute changed or on regular intervals
    if (this.minute !== this.lastEmittedMinute) {
      this.lastEmittedMinute = this.minute;
      events.emit('time:minute_changed', this.getSnapshot());
    }

    events.emit('time:tick', this.getSnapshot());
  }

  advanceDay() {
    this.day += 1;
    let seasonRollover = false;
    let yearRollover = false;

    if (this.day > DAYS_PER_SEASON) {
      this.day = 1;
      this.seasonIndex += 1;
      seasonRollover = true;

      if (this.seasonIndex >= SEASONS.length) {
        this.seasonIndex = 0;
        this.year += 1;
        yearRollover = true;
      }
    }

    events.emit('time:day_changed', {
      day: this.day,
      season: this.season,
      year: this.year
    });

    if (seasonRollover) {
      events.emit('time:season_changed', {
        season: this.season,
        year: this.year
      });
    }

    if (yearRollover) {
      events.emit('time:year_changed', {
        year: this.year
      });
    }
  }

  pause() {
    this.isPaused = true;
    events.emit('time:pause', true);
  }

  resume() {
    this.isPaused = false;
    events.emit('time:resume', false);
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0, scale);
  }

  setTime(hour, minute = 0) {
    this.hour = Math.floor(hour) % 24;
    this.minute = Math.floor(minute) % 60;
    this.second = 0;
    this.totalInGameSeconds = this.calculateTotalSeconds();
    this.lastEmittedMinute = -1;
    events.emit('time:tick', this.getSnapshot());
  }

  advanceHours(hours) {
    const totalMinutes = Math.round(hours * 60);
    for (let m = 0; m < totalMinutes; m++) {
      this.minute += 1;
      if (this.minute >= 60) {
        this.minute = 0;
        this.hour += 1;
        if (this.hour >= 24) {
          this.hour = 0;
          this.advanceDay();
        }
      }
    }
    this.second = 0;
    this.totalInGameSeconds = this.calculateTotalSeconds();
    events.emit('time:tick', this.getSnapshot());
  }

  getFormattedTime() {
    const period = this.hour >= 12 ? 'PM' : 'AM';
    const displayHour = this.hour % 12 === 0 ? 12 : this.hour % 12;
    const displayMin = String(this.minute).padStart(2, '0');
    return `${String(displayHour).padStart(2, '0')}:${displayMin} ${period}`;
  }

  getFormattedDate() {
    return `${this.season} ${this.day}, Yr ${this.year}`;
  }

  getSnapshot() {
    return {
      year: this.year,
      season: this.season,
      seasonIndex: this.seasonIndex,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: Math.floor(this.second),
      normalizedDayTime: this.normalizedDayTime,
      dayPhase: this.dayPhase,
      phaseIcon: this.phaseIcon,
      formattedTime: this.getFormattedTime(),
      formattedDate: this.getFormattedDate(),
      timeScale: this.timeScale,
      isPaused: this.isPaused
    };
  }

  serialize() {
    return {
      year: this.year,
      seasonIndex: this.seasonIndex,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: Math.floor(this.second),
      totalInGameSeconds: this.totalInGameSeconds,
      timeScale: this.timeScale
    };
  }

  deserialize(data) {
    if (!data) return;
    if (typeof data.year === 'number') this.year = data.year;
    if (typeof data.seasonIndex === 'number') this.seasonIndex = data.seasonIndex % SEASONS.length;
    if (typeof data.day === 'number') this.day = data.day;
    if (typeof data.hour === 'number') this.hour = data.hour % 24;
    if (typeof data.minute === 'number') this.minute = data.minute % 60;
    if (typeof data.second === 'number') this.second = data.second % 60;
    if (typeof data.timeScale === 'number') this.timeScale = data.timeScale;
    this.totalInGameSeconds = data.totalInGameSeconds !== undefined 
      ? data.totalInGameSeconds 
      : this.calculateTotalSeconds();

    this.lastEmittedMinute = -1;
    events.emit('time:tick', this.getSnapshot());
  }
}
