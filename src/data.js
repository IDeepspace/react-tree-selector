export default [
  {
    title: 'Resolved',
    value: '1',
    children: [
      {
        title: 'Wait for new hire',
        value: '1-1',
        children: [
          {
            title: 'Finding',
            value: '1-1-1',
          }, {
            title: 'Waiting',
            value: '1-1-2',
          },
        ],
      }, {
        title: 'Wait for rotation',
        value: '1-2',
      }, {
        title: 'Tentatively assigned',
        value: '1-3',
      },
    ],
  },
  {
    title: 'Pending',
    value: '2',
    children: [
      {
        title: 'Wait for internal confirmation',
        value: '2-1',
      }, {
        title: 'Wait for external confirmation',
        value: '2-2',
      }, {
        title: 'Role details finalization',
        value: '2-3',
      },
    ],
  },
  {
    title: 'Blocked',
    value: '3',
    children: [
      {
        title: 'Conflict',
        value: '3-1',
      }, {
        title: 'Shortage of supply',
        value: '3-2',
      }, {
        title: 'No match for skills',
        value: '3-3',
      },
      {
        title: 'Refusal from candidates',
        value: '3-4',
      },
    ],
  },
  {
    title: 'No Status',
    value: '4-0',
  },
];
