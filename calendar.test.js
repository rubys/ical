import * as calendar from './calendar.js';

// minimal event that should be able to round trip
let seed = {
  uid: 'unique',
  sequence: 5,
  stamp: '2020-02-20T12:00:00Z',
  summary: 'seed data',
  start: '2020-02-20T12:00:00Z'
}

function roundTrip(event) {
  let ical = calendar.serialize({ events: [event] });
  return calendar.parse(ical).events[0];
}

test('seed', () => {
  expect(roundTrip(seed)).toEqual(seed);
});

test('basic event', () => {
  let event = {
    ...seed,
    start: '2020-02-20T12:00:00',
    end: '2020-02-20T15:00:00',
    description: 'test event',
    location: 'here',
    url: 'http://example.com/',
    timezone: 'America/New_York',
    organizer: 'Jane Doe <jane@example.com>',
    recurrenceId: '2020-02-20T12:00:00',
    htmlDescription: '<b>Important</b>',
    geo: { lat: 44.4987, lon: -6.87667 },
    attendees: ['James Smith <james@example.com>'],
    alarms: [
      { type: 'display', trigger: 600 },
      { type: 'audio', trigger: 300, attach: 'Basso' }
    ],
    categories: [{ name: 'APPOINTMENT' }, { name: 'MEETING' }],
    transparency: 'opaque',
    status: 'confirmed',
    busystatus: 'free',
    'x-custom': 'private',
    created: '2020-02-20T12:00:00Z',
    lastModified: '2020-02-20T12:00:00Z',
  }
  expect(roundTrip(event)).toEqual(event);
});

test('all day event', () => {
  let event = {
    ...seed,
    start: '2020-02-20',
    end: '2020-02-20',
    description: 'all day event',
    allDay: true
  }

  expect(roundTrip(event)).toEqual(event);
});

test('floating event', () => {
  // note: these types of events don't round trip currently:
  //  - "floating" attribute is not inferred from the iCal data
  //  - input times are converted to UTC and then the time zone indicator is dropped
  let event = {
    ...seed,
    floating: true,
    start: '2020-02-20T12:00:00Z',
    description: 'floating event',
  }

  expect({ ...roundTrip(event), floating: true }).toEqual({ ...event, start: '2020-02-20T12:00:00' });
});


test('repeating event', () => {
  // notable ical-generator implementation details:
  //  - exclude values are converted to UTC, but with a time zone indicator.
  let event = {
    ...seed,
    repeating: {
      freq: 'MONTHLY', // required
      count: 5,
      interval: 2,
      until: "2014-01-01T00:00:00Z",
      byDay: 'SU', // repeat only sunday
      byMonth: [1, 2], // repeat only in january und february,
      byMonthDay: [1, 15], // repeat only on the 1st and 15th
      bySetPos: 3, // repeat every 3rd sunday (will take the first element of the byDay array)
      exclude: ["2013-12-25T01:00:00Z"], // exclude these dates
      excludeTimezone: 'Europe/Berlin' // timezone of exclude
    }
  }

  expect(roundTrip(event)).toEqual({
    ...event,
    repeating: {
      ...event.repeating,
      exclude: ["2013-12-25T02:00:00"]
    }
  });

});


test('appleLocation', () => {
  // note: appleLocation will construct a value for location by concatenating title and address
  let event = {
    ...seed,
    location: "My Title\nMy Address",
    appleLocation: {
      title: 'My Title',
      address: 'My Address',
      radius: '40',
      geo: {
        lat: '52.063921',
        lon: '5.128511'
      }
    }
  };

  expect(roundTrip(event)).toEqual(event);
});


test('attendee', () => {
  // delegatesTo and delegatesFrom don't currently round trip a they cleare
  // additional objects.
  let event = {
    ...seed,
    attendees: [
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        rsvp: true,
        status: 'accepted',
        type: 'individual'
      }]
  };

  expect(roundTrip(event)).toEqual(event);
});

test('alarm', () => {
  let event = {
    ...seed,
    alarms: [{
      type: 'audio',
      trigger: 600,
      repeat: 4,
      interval: 15,
      attach: 'Basso'
    }]
  };

  expect(roundTrip(event)).toEqual(event);
});

test('quoted strings', () => {
  let event = {
    ...seed,
    summary: "can't, won't, and shoudn't",
    htmlDescription: '"quoted"\nand new line'
  }

  expect(roundTrip(event)).toEqual(event);
});
