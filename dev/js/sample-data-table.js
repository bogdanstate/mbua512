/**
 * Sample Data Table
 *
 * Displays sample collected data in a styled table format.
 */

export function init(container, config = {}) {
  const data = [
    { person: "Reese", activity: "Cleaning the house", funDuring: 3.6, funAfter: 5.1 },
    { person: "Morgan", activity: "Home renovation project", funDuring: 4.6, funAfter: 4.8 },
    { person: "Lane", activity: "Marathon running", funDuring: 3.0, funAfter: 6.5 },
    { person: "Alex", activity: "Moving apartments", funDuring: 3.0, funAfter: 6.5 },
    { person: "Riley", activity: "Overnight backpacking", funDuring: 3.6, funAfter: 5.6 },
    { person: "Charlie", activity: "Cooking class", funDuring: 6.6, funAfter: 7.0 },
    { person: "Quinn", activity: "Concert", funDuring: 8.4, funAfter: 8.2 },
    { person: "Kit", activity: "Waiting in line", funDuring: 4.7, funAfter: 3.6 },
    { person: "Devon", activity: "Road trip with music", funDuring: 7.4, funAfter: 6.8 },
    { person: "Quinn", activity: "Picnic in the park", funDuring: 9.4, funAfter: 10.0 }
  ];

  let tableRows = '';
  data.forEach((row, i) => {
    const bg = i % 2 === 0 ? '#f8f9fa' : '#fff';
    tableRows += `
      <tr style="background: ${bg};">
        <td style="padding: 12px 24px;">${row.person}</td>
        <td style="padding: 12px 24px;">${row.activity}</td>
        <td style="padding: 12px 24px; text-align: center;">${row.funDuring}</td>
        <td style="padding: 12px 24px; text-align: center;">${row.funAfter}</td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px;">
      <h2 style="margin-bottom: 30px; color: #333; font-weight: 400; font-size: 2em;">Sample of Collected Data</h2>
      <table style="border-collapse: collapse; font-size: 1.1em; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff;">
            <th style="padding: 16px 24px; text-align: left;">Person</th>
            <th style="padding: 16px 24px; text-align: left;">Activity Type</th>
            <th style="padding: 16px 24px; text-align: center;">Fun During</th>
            <th style="padding: 16px 24px; text-align: center;">Fun After</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p style="margin-top: 20px; color: #888; font-size: 0.9em;">Showing 10 of 100 observations</p>
    </div>
  `;

  return {
    destroy() {}
  };
}

export default { init };
