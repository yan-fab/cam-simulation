# Cylindrical Cam Mechanism Simulation

A real-time, interactive 3D physics simulation of a cylindrical cam mechanism built entirely with web technologies.

## Overview
This project simulates the mechanical behavior of a grooved cylindrical cam driving a sliding follower. Instead of merely playing an animation, the application dynamically "machines" the 3D groove into the cylinder using Constructive Solid Geometry (CSG) and calculates the exact kinematic derivatives to drive the physical engine.

## Features
* **Real-time 3D Rendering:** Fully interactive 3D environment built with [Three.js](https://threejs.org/).
* **Dynamic Boolean Machining:** The helical groove on the cylinder is physically cut out of the mesh in real-time using `three-csg-ts`.
* **Advanced Physics Engine:** Uses an explicit Euler-Lagrange approach. The engine isn't perfectly rigid; it simulates a realistic motor with finite torque trying to drive a dynamic load. 
  * Calculates the **Effective Moment of Inertia** dynamically.
  * Implements **Newton's Second Law** (`F = m*a`) to simulate how heavy loads slow down the motor during high-acceleration strokes.
  * Factors in normal forces, gravity, and kinetic friction on the sliding bearing blocks.
* **Interactive Telemetry UI:** 
  * Adjust mass, gravity, kinetic friction, and motor target speed in real-time.
  * Live-updating telemetry charts (Position, Velocity, and Inertial Force) powered by [Chart.js](https://www.chartjs.org/).

## Technologies
- Vanilla HTML5 / CSS3 / JavaScript (ES6)
- Three.js (`v0.160.0`)
- three-csg-ts (for Boolean geometry subtraction)
- Chart.js (for high-performance data plotting)

## How to Run
Since this project uses no build steps or heavy frameworks, it is extremely lightweight. However, due to ES6 module CORS policies, you must serve it over a local HTTP server.

1. Clone the repository.
2. Open a terminal in the folder.
3. Run a local server. For example, using Python:
   ```bash
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your web browser.

## License
MIT License
