const e=`# Timer Trigger ⏰\r
\r
## Id\r
\r
\`timer-trigger\`\r
\r
## Description\r
\r
This trigger node fires the workflow at specified intervals or at a specific time. Supports flexible scheduling options including immediate execution on start, interval-based scheduling, and specific time scheduling with day selection.\r
\r
## Tags\r
\r
timer, trigger, scheduling, interval, cron, automation\r
\r
## Input Parameters\r
\r
### Required\r
\r
- **fireOnStart** (string, default='Yes'): Fire the trigger immediately when the workflow starts\r
- **scheduleType** (string, default='Interval'): Choose between interval-based or specific time scheduling\r
\r
### Optional\r
\r
- **schedule** (string, default='Every Minute') [Interval operations only]: Select the interval for the timer (Every Minute, Every 5 Minutes, Every 15 Minutes, Every 30 Minutes, Hourly, Daily, Weekly, Monthly)\r
- **specificTime** (string) [Specific Time operations only]: Select the specific time to run the trigger\r
- **specificDays** (array) [Specific Time operations only]: Select the days to run the trigger at the specific time (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)\r
\r
## Output Format\r
\r
- **timestamp** (string): The timestamp when the trigger fired\r
`;export{e as default};
