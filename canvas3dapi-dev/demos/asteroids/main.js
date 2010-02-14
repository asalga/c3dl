/*
  Copyright (c) 2009 Seneca College
  Licenced under the MIT License 
(http://www.c3dl.org/index.php/mit-license/)
*/

/*
	C3DL Asteroids
	
	Demonstration of some of the capabilities of Canvas 3d.
	
	Interesting features:
		Collision detection is currently handled by:
			simple proximity (distSquared) tests.
			Therefore everything has spherical bounds.
		
		Sustained keyboard events are handled by:
			pushing keysPressed into an array of currently Pressed keys.
		
		This could use better OOP principles.
			Currently, all of the action is handled by this script, so
			the gameloop is obligated to check collisions.
			A better approach might be to construct entity objects and
			allow them to manage their own collisions.

		The game is top-down like the original asteroids, so:
			most of the vector calculations ignore the z value.
		Also: 
			There's no scrolling map.
			Therefore: When entities hit the global bounding box, 
			they re-emerge on the opposite side of the map
	
		Unusual game mechanic:
			You can add "friendly" AI ships to the game by increasing numShips.
			the AI isn't very smart though.
*/ 

// USER DEFINED GLOBALS
var SHIP_SPEED = 0.01;
var DRAG = 0.98; // 1 = frictionless, 0.95 will slow ships down quickly.
var ANGULAR_DRAG = 0.3;
var SHIP_VALUE = 1000;
var ASTEROID_VALUE = 0;
var GEM_VALUE = 100;
var TURNING_SPEED = 1.80;
var GOD_MODE = false;
var NUM_LIVES = 5;

// Global variables
var cam;
var scn;
var pick;

var SkySphere_obj; // skybox

var gameLevel = 1;
var livesRemaining = NUM_LIVES;

var totaltime = 0;
var lastScoreUpdateTime = 0;
var lastMouseUpdateTime = 0;
var timeOfLastDeath = -1000;
var spaceShips = new Array();
var numShips = 1;

var lasers = new Array();
var laserSpeed = .5;
var laserCount = 0;
var lastShot = 0;
var lasersOn = true; // autofire. Can be toggled.

var asteroids = new Array();
var numAsteroids = 5;

var prizes = new Array();
var explosions = new Array();

var canvasWidth = 60;
var canvasHeight = 40;
var canvasDepth = 80;
var depthOffset = -30;
var halfWidth = 30;
var halfHeight = 20;
var halfDepth = 40;

var canvasName = "c3dlAsteroids";

//controls
var controlPrefs = "mouse";
var sdKeys; // array to hold specific keys
var leftKey; // object which holds information about the left key
var upKey;
var rightKey;
var shootKey;
var mouseX = 0;
var mouseY = 0;

var score = 0;
var lastScore = -1; // use this variable to see if the score changed enough to warrant a new html document.write
var numTicks = 0;


var thisTable;
var tableName = "gameTable";
var debugCell;
var lastDebugOutputTime = 0;

//sounds
var sndLaserEmbed = null;
var sndDingEmbed = null;
var sndExplosionEmbed = null;

var INSTRUCTIONS = "<p align = center>Use the mouse to orient your spaceship. Press the mouse button to fly forward.<br>"
INSTRUCTIONS += "Shoot asteroids and collect the gold which emerges from the rubble</p>";


// load the models before rendering page
c3dl.addMainCallBack(canvasMain, "c3dlAsteroids");
c3dl.addModel("models/spaceShip.dae");
c3dl.addModel("models/laser.dae");
//c3dl.addModel("skybox.dae");
c3dl.addModel('models/sky_sphere.dae');
c3dl.addModel("models/asteroid.dae");
c3dl.addModel("models/asteroid2.dae");
c3dl.addModel("models/prize.dae");
c3dl.addModel("models/explosion.dae");



//add the particle system
/*var psys = new c3dl.ParticleSystem();
psys.setMinVelocity([-20,-20,-20]);
psys.setMaxVelocity([20,20,20]);
psys.setMinLifetime(0.2);
psys.setMaxLifetime(1.0);
psys.setMinColor([0.5,0.4,0.0,0.5]);
psys.setMaxColor([1,0.6,0,1]);
psys.setSrcBlend(c3dl.const.ONE);
psys.setDstBlend(c3dl.const.ONE);
psys.setTexture("flare.jpg");
psys.setAcceleration([0,0,0]);
psys.setEmitRate(0);
psys.init(50);*/
		

// *********************** Objects *********************************

function SDkey(identifier) { // for storing information about keyboard actions
	// I created this object class to handle keypress events. Since they're thrown really quickly under windows, I need to slow down their action.
	this.keyName = identifier;
	this.code;
	this.timeLastPressed;
	this.status;
	this.timeLastLifted;
	this.lagTime; // how many milliseconds to wait between issuing the command again
}



// *********************** Functions ********************************

function initGame(canvasName)
{
	totaltime=0;
	scn.init(canvasName);
	setupSpaceShips(numShips);
	setupAsteroids(numAsteroids);
}

function initializeVariables()
{
	var keyNames = new Array("left", "up", "down", "shoot");
	sdKeys = new Array();
	
	for (var i = 0; i < keyNames.length; i++) { // setup the key objects
		thisKeyObj = new SDkey(keyNames[i]);
		sdKeys.push(thisKeyObj); // this creates a key object with the name from the array
		sdKeys[i].code = 37+i; // left is keycode 37, up is 38, right is 39
		sdKeys[i].timeLastPressed = 0;
		sdKeys[i].status = "up";
		sdKeys[i].timeLastLifted = 0;
		sdKeys[i].lagTime = 50;
	}

	leftKey = sdKeys[0];
	upKey = sdKeys[1];
	rightKey = sdKeys[2];
	shootKey = sdKeys[3];
	shootKey.code = 32;
}

function getControlPreferences() {
/*
	formObj = document.getElementById("controlPrefs");
	var radioLength = formObj.length;
	
	for(var i = 0; i < radioLength; i++) {
		if(formObj[i].checked) {
			return formObj[i].value;
		}
	}*/
	return "mouse"; // if nothing is checked or you can't find the form, use mouse controls
  
}

function setupScene(sceneName) { // only need to do this once.
	  // create a new c3dl.Scene object
	  scn = new c3dl.Scene();
	  scn.setCanvasTag(sceneName);
	  renderer = new c3dl.WebGL();
	  scn.setRenderer(renderer);
	  scn.setAmbientLight([0.4,0.4,0.4]);
//	  scn.addObjectToScene(psys);
}

function setupSpaceShips(num) {
	
	for(var i=0;i<num;i++) {
		spawnSingleShip();
	}
}

/*
*/
function setupSkybox()
{
	SkySphere_obj = new c3dl.Collada();
	SkySphere_obj.init("models/sky_sphere.dae");
	SkySphere_obj.setTexture("textures/stars.gif");
	scn.setSkyModel(SkySphere_obj);
}


function startNextLevel() {
	totaltime = 0;
	updateScoreDisplay(score);
	lastScoreUpdateTime = 0;
	
	// cleanup(); // cleanup is a drag because it removes the prizes.
	lastShot = 0;
	gameLevel +=1;
	regenerateField();		
}

/*
	SHOULD generate some number of asteroids, located around the edges of the screen and coming in toward the centre.
	the number of asteroids increases as the level goes up. So does their speed.
*/
function setupAsteroids(num) {
	
	 for(var i=0;i<num;i++)
	 {
		var randomDir = new Array(Math.random()*2-1, Math.random()*2-1, 0 );

		horizontalDir = randomDir[0] / Math.abs(randomDir[0]); // -1 for left, 1 for right
		verticalDir = randomDir[1] / Math.abs(randomDir[1]); // -1 for down, 1 for up
		
		var diceRoll = Math.random(); // pick a random side..
		if (diceRoll > 0.5) { 
			edge = "vertical";
		} else { 
			edge = "horizontal";
		}
		
		// generate random values for x and y, then move them if they're on the wrong side?		
		if (edge == "vertical") {
			rndX = horizontalDir * ( halfWidth + Math.random()*(halfWidth/4) );
			rndY = Math.random() * canvasHeight - halfHeight;
		} else {
			rndX = Math.random() * canvasWidth - halfWidth;
			rndY = verticalDir * ( halfHeight + Math.random() * (halfHeight/4) );
		}

		spawnSingleAsteroid(2, [rndX , rndY , depthOffset])
	}
}

/*
	s - scale
	
*/
function spawnSingleAsteroid(s, position) {

	var diceRoll = Math.random();
	thisAsteroid = new c3dl.Collada();

	if (diceRoll > 0.5) {
		thisAsteroid.init("models/asteroid.dae");
		thisAsteroid.setTexture("textures/asteroid.png");
	} else {
		thisAsteroid.init("models/asteroid2.dae");
		thisAsteroid.setTexture("textures/asteroid2.png");
	}

	thisAsteroid.scale([s,s,s]);
	thisAsteroid.myScale = s;

	thisAsteroid.translate(position);
	var randomDir = new Array(Math.random()*2-1, Math.random()*2-1, 0 );	
//	thisAsteroid.myLinearVel = ( scaleVector(randomDir, 0.025*(gameLevel/10) / thisAsteroid.myScale )  );
	
	thisAsteroid.setLinearVel(c3dl.multiplyVector(randomDir, 0.1));
	//scaleVector(randomDir, 0.025*(gameLevel/10) / thisAsteroid.myScale ));

	thisAsteroid.setAngularVel(new Array(Math.random() * 0.01 - 0.005, Math.random() * 0.01 - 0.005, Math.random()*0.01 - 0.005));
	asteroids.push(thisAsteroid);
	scn.addObjectToScene(thisAsteroid);
}

function spawnExplosion(position, reason)
{
	var scale = 0.75;
	thisExplosion = new c3dl.Collada();
	thisExplosion.init("models/explosion.dae");
	thisExplosion.scale(new Array(scale,scale,scale));
	thisExplosion.setTexture("textures/explosion.png");
	thisExplosion.myScale = scale;

	thisExplosion.translate(position);
	var randomDir = new Array(Math.random()*2-1, Math.random()*2-1, 0 );	
	thisExplosion.setAngularVel(new Array(0, Math.random() * 0.05 + 0.025 , 0));

	thisExplosion.pitch(Math.PI/2);
	thisExplosion.timeAdded = totaltime;

	explosions.push(thisExplosion);
	scn.addObjectToScene(thisExplosion);
}

function removeOldExplosions() {
	var i = 0;
	while( i < explosions.length) { // ie for each explosion
		if ( totaltime - 1000 > explosions[i].timeAdded ) { // remove it
			//printDebug("totaltime: "+totaltime+", explosion["+i+"].timeAdded = "+explosions[i].timeAdded);
			scn.removeObjectFromScene(explosions[i]);
			explosions.splice(i, 1);
		} else {
			//printDebug(explosions[i].getScale);
			explosions[i].scale( [1.5, 1.5, 1.5] );
			i++;
		}
	}

}

function spawnSinglePrize(position)
{
	var scale = 0.75;
	thisPrize = new c3dl.Collada();
	thisPrize.init("models/prize.dae");
	thisPrize.scale(new Array(scale,scale,scale));
	thisPrize.setTexture("textures/prize.png");
	thisPrize.myScale = scale;

	thisPrize.translate(position);
	var randomDir = new Array(Math.random()*2-1, Math.random()*2-1, 0 );	
	//thisPrize.myLinearVel = scaleVector(randomDir, 0.025*(gameLevel/10) / thisPrize.myScale )  ;

	//thisPrize.setLinearVel( thisPrize.myLinearVel  );
	//thisPrize.setLinearVel( scaleVector(randomDir, 0.0001 ));
	thisPrize.setLinearVel( c3dl.multiplyVector(randomDir, 0.0001 ));

	thisPrize.setAngularVel(new Array(Math.random() * 0.01 - 0.005, Math.random() * 0.01 - 0.005, Math.random()*0.01 - 0.005));
	prizes.push(thisPrize);
	scn.addObjectToScene(thisPrize);
}

function spawnSingleShip()
{
	thisShip = new c3dl.Collada();
	thisShip.init("models/spaceShip.dae");
	thisShip.scale(new Array(0.5,0.5,0.5));
	thisShip.setTexture("textures/texturedWhiteShip.png");
	thisShip.translate(new Array(0, 0, depthOffset) );
	thisShip.setLinearVel(new Array(0.001,0,0));
	scn.addObjectToScene(thisShip);	// Add the object to the scene

	thisShip.pitch(Math.PI/2); // make sure they're displayed: top down
      
	spaceShips.push(thisShip);
}

function setupLights(name, strength) { // names: "ambient", "lamp", "sun" (aka directional)

	if (name == "ambient") {
		//// 1 light with only ambient light
		var ambient = new c3dl.PositionalLight();
		ambient.setName('ambient');
		ambient.setPosition([0,0,0]);
		ambient.setAmbient([strength,strength,strength,1]);
		ambient.setOn(true);
		scn.addLight(ambient);
    } else if ( name == "lamp" ) {
		// 2 positional light with diffuse
		var diffuse = new c3dl.PositionalLight();
		diffuse.setName('diffuse');
		diffuse.setPosition([5,5,0]);
		diffuse.setDiffuse([strength, strength/2, strength/2,1]);
		diffuse.setOn(true);
		scn.addLight(diffuse);
	} else if ( name == "sun") {
		// 3 purple directional light
		var directional = new c3dl.DirectionalLight();
		directional.setName('dir');
		directional.setDirection([1,-1,-1]);
		directional.setDiffuse([strength,strength,strength,1]);
		directional.setOn(true);
		scn.addLight(directional);
	}
}

function setupCamera()
{
    // create a camera
    cam = new c3dl.FreeCamera();

    //set the camera position
    cam.setPosition([0,0,-depthOffset]);

    // make it look into the scene
    // remember negative z in a right handed system is
    // pointing out of screen, so negative z is pointing in
    cam.setLookAtPoint([0,0,-1]);

    // add the camera to the scene
	scn.setCamera(cam);
}

function setupScoreboard(tableName)
{
	thisTable = document.getElementById(tableName);
	if(thisTable)
  {
  scoreCell = thisTable.rows[0].cells[0];
	scoreCell.innerHTML = "Gold: ";

	titleCell = thisTable.rows[0].cells[1];
	titleCell.innerHTML = "Welcome to C3DL Asteroids";

	resetCell = thisTable.rows[0].cells[2];
	resetCell.innerHTML = '<A href=\"#\" onMouseDown=\"return restartGame()\" ><img name=\"resetBTN\" src=\"resetBTN.PNG\" width=\"110\" height=\"28\" border=\"0\" alt=\"javascript button\">';
	var resetBTN = document.images["resetBTN"];
  }
}

function updateScoreDisplay(newScore)
{
  document.getElementById("gold").innerHTML = "Gold: " + newScore;

/*
	thisTable = document.getElementById(tableName);
	thisCell = thisTable.rows[0].cells[0];
	
	nextCell = thisTable.rows[2].cells[0];
	nextCell.innerHTML = "Wave: " + gameLevel;
	
	lastCell = thisTable.rows[2].cells[3];
	lastCell.innerHTML = "Lives: " + livesRemaining;
  */
}

function clearDebugLog()
{
}

function printDebug(strText) {	
	if (totaltime > lastDebugOutputTime + 500 || totaltime < lastDebugOutputTime) { // slow down the debug output
		lastDebugOutputTime = totaltime;
	}
}

function dumpDebugInfo() {
	thisTable = document.getElementById(tableName);
	debugCell = thisTable.rows[2].cells[0];
	debugCell.innerHTML = "";
	
	printDebug("<p><b>Variables:</b></p>")
	printDebug("asteroids.length: " + asteroids.length);
	printDebug("spaceShips.length: " + spaceShips.length);
	printDebug("lasers.length: " + lasers.length);
	printDebug("keysHeld: ");
	
	printDebug("Verifying vector math");
	var vector1 = new Array(1,3,5);
	var vector2 = new Array(2,3,6);
	printDebug("adding two vectors: " + vector1 + " and " + vector2 + ":  " + addVectors(vector1, vector2));
	printDebug("scaling a vector: "+vector1+" by 3: " + scaleVector(vector1,3) );

}

function checkWallCollisions(objArr) {
	// should detect when entities are outside the bounding cube,
	// then translate them to the opposite side

	for (var i = 0; i < objArr.length; i++) {
	
		var location = objArr[i].getPosition();
		var direction = objArr[i].getLinearVel(); // may not be normalized.
		
		var xLoc = location[0];
		var yLoc = location[1];
		var zLoc = location[2];
		var xDir = direction[0];
		var yDir = direction[1];
		
		var xTranslate = 0;
		var yTranslate = 0;
		var zTranslate = 0;
		if (xLoc < -halfWidth && xDir <= 0 ) { // hit left edge
			xTranslate = canvasWidth;
		} else if ( xLoc > halfWidth && xDir >= 0) { //hit right edge
			xTranslate = -canvasWidth;
		}
		
		if (yLoc < -halfHeight && yDir <= 0) { // hit the bottom edge
			yTranslate = canvasHeight;
		} else if (yLoc > halfHeight && yDir >= 0) { // hit the top edge
			yTranslate = -canvasHeight;
		}
		
		if (zLoc < -halfDepth + depthOffset) { // hit the far edge
			zTranslate = canvasDepth;
		} else if (zLoc > halfDepth + depthOffset) { // hit the near edge
			zTranslate = -canvasDepth;
		}

		objArr[i].translate(new Array(xTranslate, yTranslate, zTranslate));
		
	}
}

/*
	called with any object with a getPosition function
*/
function fireLasers(origin)
{

	//if (laserCount % 10 == 0 ) { // keyboard events are frequent.. only shoot on the twentieth repeat
	if ( totaltime > lastShot + 250  ) { // keyboard events are frequent.. only shoot four times a second
		lastShot = totaltime;
		sndLaserPlay();
		for (var i = 0; i < 2; i++) {
			var direction = origin.getDirection();
			var rotNinetyDir = rotNinetyZ(direction);
			//rotNinetyDir = scaleVector(rotNinetyDir, 1.85);
			rotNinetyDir = c3dl.multiplyVector(rotNinetyDir, 1.85);
			//direction = scaleVector(direction, 3);
			direction = c3dl.multiplyVector(direction, 3);
			
			var oldPosition = origin.getPosition();
			if (i == 0) {
				newX = oldPosition[0] + rotNinetyDir[0] + direction[0];
				newY = oldPosition[1] + rotNinetyDir[1] + direction[1];
				newZ = depthOffset;
				position = new Array(newX, newY, newZ);
			} else if (i == 1) {
				newX = oldPosition[0] - rotNinetyDir[0] + direction[0];
				newY = oldPosition[1] - rotNinetyDir[1] + direction[1];
				newZ = depthOffset;
				position = new Array(newX, newY, newZ);
			}
		
			thisLaser = new c3dl.Collada();
			thisLaser.init("models/laser.dae");
			thisLaser.setTexture("textures/laser.png");
			thisLaser.pitch(Math.PI/2);
			
			// this is a lot of work to get a proper world rotation.. There might be an easier way.
			// .. use atan(y/x) to find the angle of rotation, then apply that angle to the laser as a yaw.
			// .. atan can't tell +x from -x, so multiply leftward rotations by -1 (or x/abs(x) )
			// .. uses Math.max to prevent divide by zero errors.

			xVal = direction[0];
			if (xVal == 0) xVal = 0.000001; // prevent divide by zero errors
			yVal = direction[1];
			atan2DirectionModifier = xVal/Math.abs(xVal);
			ninetyDegrees = Math.PI/2;
			var theta = Math.atan( yVal/xVal ) + (ninetyDegrees)*(atan2DirectionModifier);
			//printDebug("laser theta = "+theta+ " = Math.atan(" +direction[1]+ "\/" +direction[0]+ ")");
			thisLaser.yaw( theta ); // get the rotation with trig 

			thisLaser.scale(new Array(1,1,1));
			thisLaser.translate( new Array(position[0], position[1], position[2]) );
				
			// Add the object to the scene
			scn.addObjectToScene(thisLaser);
			lasers.push(thisLaser);
			
			//spaceShips[i].yaw(Math.random() * 2*Math.PI); // set initial direction left
			//spaceShips[i].pitch(Math.random() * 2*Math.PI); // angle up
			//thisLaser.setLinearVel(scaleVector(direction, laserSpeed) );
			thisLaser.setLinearVel(c3dl.multiplyVector(direction, laserSpeed) );
		}
	}
	laserCount += 2;
}

function testTwoArraysForCollisions(testersArr, testeesArr) {

	if (testersArr.length > 0) {
		var testerIndexNum = 0;
		while (testerIndexNum < testersArr.length && testeesArr.length > 0) {
			entity = testersArr[testerIndexNum];
			testeeIndexNum = checkObjectForCollisionWithArray(entity, testeesArr);
			if ( testeeIndexNum > -1 ) { // entity collided with testeesArr[collisionIndexNum]
				//printDebug("some entity collided with some other entity, having index: " + collisionIndexNum + " in their array");


				if (testersArr == lasers && testeesArr == asteroids) {
					removeLaser(testerIndexNum);
					blowupAsteroid(testeeIndexNum);
				} else if (testersArr == lasers && testeesArr == spaceShips) {
					removeLaser(testerIndexNum);
					blowupFriendlySpaceShip(testeeIndexNum);
				} else if (testersArr == spaceShips && testeesArr == asteroids) {
					// test asteroids before you test ships
					//that way, a newly spawned ship won't blow up immediately.
					blowupAsteroid(testeeIndexNum);
					blowupFriendlySpaceShip(testerIndexNum);
				} else if (testersArr == spaceShips && testeesArr == prizes ) {
					collectPrize(testeeIndexNum);
				} else if (testersArr == lasers && testeesArr == prizes) {
					destroyPrize(testeeIndexNum);
				}
					
			} else { // no collision this time
				testerIndexNum++;
			}
		}
	}
}

function checkObjectForCollisionWithArray(testingObj, collisionArr) { // returns the first collision it finds (no particular sorting)
	var indexNum = 0;
	var collision = false;
	var tolerance = 16;
	var toleranceFactor = 1;
	
	while (indexNum < collisionArr.length && collision == false && collisionArr.length > 0) { // for every object in array
		if (collisionArr[indexNum].myScale != null) {
			toleranceFactor = collisionArr[indexNum].myScale;
		}
		if (getDistanceSquared(testingObj, collisionArr[indexNum]) < tolerance) {
			collision = true;
			return indexNum;

		} else {
			indexNum++;
		}
	}
	if (collision == false) return -1;
}


// ************* SOUNDS *****************

function setupAudio()
{
	sndLaserPlay();
	sndDingPlay();
	sndExplosionPlay();
}

function sndLaserPlay()
{
	sndLaserStop();
	sndLaserEmbed = document.createElement("embed");
	sndLaserEmbed.setAttribute("src", "sounds/laser.wav");
	sndLaserEmbed.setAttribute("hidden", true);
	sndLaserEmbed.setAttribute("autostart", true);
	document.body.appendChild(sndLaserEmbed);
		
}

function sndLaserStop()
{
	if ( sndLaserEmbed )
	{
		document.body.removeChild(sndLaserEmbed);
		sndLaserEmbed = null;
	}
}

function sndDingPlay()
{
	sndDingStop();
	sndDingEmbed = document.createElement("embed");
	sndDingEmbed.setAttribute("src", "sounds/ding.wav");
	sndDingEmbed.setAttribute("hidden", true);
	sndDingEmbed.setAttribute("autostart", true);
	document.body.appendChild(sndDingEmbed);
		
}

function sndDingStop()
{
	if ( sndDingEmbed )
	{
		document.body.removeChild(sndDingEmbed);
		sndDingEmbed = null;
	}
}

function sndExplosionPlay()
{
	sndExplosionStop();
	sndExplosionEmbed = document.createElement("embed");
	sndExplosionEmbed.setAttribute("src", "sounds/explosion.wav");
	sndExplosionEmbed.setAttribute("hidden", true);
	sndExplosionEmbed.setAttribute("autostart", true);
	document.body.appendChild(sndExplosionEmbed);
		
}

function sndExplosionStop()
{
	if ( sndExplosionEmbed )
	{
		document.body.removeChild(sndExplosionEmbed);
		sndExplosionEmbed = null;
	}
}

// ****************** Cleanup and Scoring ********************
function removeLaser(num)
{
	scn.removeObjectFromScene(lasers[num]);
	lasers.splice(num, 1);
}

function blowupAsteroid(num)
{
	thisAsteroid = asteroids[num];
	position = thisAsteroid.getPosition();
	score += ASTEROID_VALUE;

	// smaller astroids can be created if a large one is destroyed.
	var numAsteroidsCreated = 0;

	if ( thisAsteroid.myScale > 1 ) {
		sndExplosionPlay();
		numAsteroidsCreated = Math.round(Math.random()*4);
		
		for (var i = 0; i < numAsteroidsCreated; i++) { // generate 1-3 asteroids
			spawnSingleAsteroid(1, position);
		}

// 		psys.setPosition([position[0],position[1],position[2]]);
	//	psys.emit((numAsteroidsCreated+3) * 3);
	}
	else if ( thisAsteroid.myScale > 0.5)
	{
		sndExplosionPlay();
		numAsteroidsCreated = Math.round(Math.random()*3);

		for (var i = 0; i < numAsteroidsCreated; i++) { // generate 1-3 asteroids
			spawnSingleAsteroid(0.5, position );
		}
		
		//psys.setPosition([position[0],position[1],position[2]]);
		//psys.emit((numAsteroidsCreated+3) * 3);
	} 
	else if ( thisAsteroid.myScale > 0 ) { 
		if (Math.random() > 0.75 ) {
			spawnSinglePrize( position );
		}
	}

	// shooting the last asteroid.. congrats, you cleared the level
	if (asteroids.length <= 1 && spaceShips.length > 0)
	{
		startNextLevel();
	}

	scn.removeObjectFromScene(asteroids[num]);
	asteroids.splice(num, 1);
}


/*
	this function checks to see how many ships are left onscreen and in reserve.
	if there's a ship onscree, the player will start using it automatically (ship[0]);
	otherwise, subtract one from livesRemaining
	if you're out of lives, it's GAME OVER
*/
function blowupFriendlySpaceShip(num)
{
	randomNum = Math.floor(Math.random()*4.9 + 3);

	thisShip = spaceShips[num];
	position = thisShip.getPosition();

	scn.removeObjectFromScene(thisShip);
	spaceShips.splice(num, 1);
	
	if ( num == 0 && livesRemaining > 0 && spaceShips.length == 0) { // lost a life, but you have more
		
		livesRemaining--;
		sndExplosionPlay();
		cleanup();
		spawnExplosion(position, "playerDeath");
		timeOfLastDeath = totaltime;
		updateScoreDisplay(score);
		
	} else if ( num == 0 && livesRemaining == 0 && spaceShips.length == 0) { // too bad, you're all out of lives
		cleanup()
		sndExplosionPlay();
		spawnExplosion(position, "playerDeath");
	}
}

function collectPrize(num)
{
	sndDingPlay();
	thisPrize = prizes[num];	
	scn.removeObjectFromScene(thisPrize);
	prizes.splice(num, 1);
	score += Math.round(Math.random()*GEM_VALUE) + Math.round(Math.random()*GEM_VALUE);
}

function destroyPrize(num)
{
	thisPrize = prizes[num];	
	scn.removeObjectFromScene(thisPrize);
	prizes.splice(num, 1);
}

function restartGame() {
	sndDingPlay();
	livesRemaining = NUM_LIVES;
	score = 0;
	gameLevel = 1;
	totaltime = 0;
	lastScoreUpdateTime = 0;
	cleanup();
	initializeVariables();
	initGame();
}

function cleanup() {
	var i=0;
	
	allArrays = new Array(asteroids, lasers, spaceShips, prizes, explosions);
	
	for (arrayNum = 0; arrayNum < allArrays.length; arrayNum++) {
		thisArr = allArrays[arrayNum];
	
		while (i < thisArr.length) {
			obj = thisArr.pop();
			scn.removeObjectFromScene(obj);
		}
	}
	
	for (i = 0; i < sdKeys.length; i++) {
		sdKeys[i].timeLastPressed = 0;
		sdKeys[i].timeLastLifted = 0;
		sdKeys[i].status = "up";
	}
	
	lastShot = 0;
	totaltime = 0;
	lastDebugOutputTime = 0;
	clearDebugLog();
}

// ****************Math Stuff and other utils****************************

function roundToTwoDigits(num)
{
	return Math.round(num*100)/100;
}

function roundVectorToTwoDigits(vectorArr) {
	var newVector = new Array();
	for (i=0; i< vectorArr.length; i++) {
		newVector.push( roundToTwoDigits(vectorArr[i] ));
	}
	return newVector;

}

function getDistanceSquared(obj1, obj2) {
	obj1Pos = obj1.getPosition();
	obj2Pos = obj2.getPosition();
	
	distSquared = Math.pow(obj1Pos[0]-obj2Pos[0], 2) + Math.pow(obj1Pos[1]-obj2Pos[1], 2);

	return distSquared;
}

function getDistanceTo(obj1, obj2) { // return the actual distance. Expensive, but sometimes useful
	return Math.sqrt( getDistanceSquared(obj1, obj2));
}


function rotNinetyZ(vectorArr) {
	newVector = new Array;
	newVector[0] = vectorArr[1];
	newVector[1] = -vectorArr[0];
	newVector[2] = vectorArr[2];
	return newVector;

}

function rotOneEightyZ(vectorArr) {
	newVector = new Array();
	newVector[0] = -vectorArr[0];
	newVector[1] = -vectorArr[1];
	newVector[2] = vectorArr[2];
	return newVector;

}

function dotProd(vector1, vector2) { // return the dot product of two vector arrays of equal length.
	if (vector1.length != vector2.length) return false;

	var sum = 0;
	for (i = 0; i<vector1.length; i++) {
		sum += vector1[i]*vector2[i];
	}
	
	return sum;
	
}

function insideBox(object, boxCornerArr, oppositeCornerArr) {
// test whether a given point is inside the bounds of a given box (defined by two corners).
// eg: if insideBox(spaceShip, new Array(100,120), new Array(200,200)


	

	minX = Math.min(boxCornerArr[0], oppositeCornerArr[0]);
	minY = Math.min(boxCornerArr[1], oppositeCornerArr[1]);
	maxX = Math.max(boxCornerArr[0], oppositeCornerArr[0]);
	maxY = Math.max(boxCornerArr[1], oppositeCornerArr[1]);
	
	if ( minX < testPointArr[0] < maxX && minY < testPointArr[1] < maxY ) { // point is inside box
		return true;
	} else {
		return false;
	}
}

function removeOffscreenLasers() {
	var i = 0;
	
	while (i < lasers.length && lasers.length > 0) {
		if ( laserOffscreen(lasers[i]) == 1 ) {
			scn.removeObjectFromScene(lasers[i]);
			lasers.splice(i,1);
	
		} else {
			i++;
		}
	}
}

function laserOffscreen(obj) {
	var laserLocation = obj.getPosition();
	//printDebug("function offscree believes laser position is: " & obj.getPosition());
	
	if (Math.abs(laserLocation[0]) > canvasWidth/2  ||
		Math.abs(laserLocation[1]) > canvasHeight/2 ||
		Math.abs(laserLocation[2]) > canvasDepth/2     ) {
			return 1; // offscreen = true;
	} else {
		return -1; // offscreen = false;
	}
	
	return 0;

}



function induceRotationalDrag(thisShip) {
//	thisShip.setAngularVel(scaleVector( thisShip.getAngularVel(), ANGULAR_DRAG ));
	thisShip.setAngularVel(c3dl.multiplyVector( thisShip.getAngularVel(), ANGULAR_DRAG ));
}

function induceLinearDrag(thisShip) 
{
	currentVel = thisShip.getLinearVel(); // get this again so the next line doesn't overwrite movement.
	newVelocity = c3dl.multiplyVector( currentVel, DRAG);
	thisShip.setLinearVel( newVelocity );
	// rotate the skybox to give illusion of speed.
	var velocityMagnitude = c3dl.vectorLength(newVelocity); // always positive.. 
	var direction = thisShip.getDirection();

	// kinda need this to rotate on global / world coordinates
	var skyBoxRotation = new Array( -direction[1], direction[0], 0); 
	
	skyBoxRotation = c3dl.multiplyVector(skyBoxRotation, 0.01*velocityMagnitude);
	SkySphere_obj.setAngularVel(skyBoxRotation);//direction[0]/1000,[-direction[1]/1000,0] );	
}

function getDirectionToTarget(thisShip, targetPos) {
	// get the vector between the ship and the mouse position
	// rotate it 90z and do a dot product with the ship direction (WHY?)
	// negative result means turn left
	// positive resutl means turn right
	// (or maybe the other way around)
	
	currentDirection = thisShip.getDirection();
	shipLocation = thisShip.getPosition();
	
	translatedTargetDirectionVector = c3dl.addVectors(targetPos, c3dl.multiplyVector(shipLocation, -1)) // subtract shipLoc from mousePos
	rotatedCurrentDirectionVector = rotNinetyZ(currentDirection);
	
	rotationDirection = dotProd(translatedTargetDirectionVector, rotatedCurrentDirectionVector);
	//rotationDirection = dotProd(translatedTargetDirectionVector, currentDirection);

	return rotationDirection;
	
}

/*
	To give the illusion of speed, 
	move the ship forward
	and move the asteroids in the opposite direction 
*/
function goForward(thisShip) {
	
	var direction = thisShip.getDirection();
	var currentVel = thisShip.getLinearVel();
	var newVelocity = c3dl.addVectors(currentVel, c3dl.multiplyVector(direction, SHIP_SPEED/3) ) // go faster

	var velocityMagnitude = c3dl.vectorLength(newVelocity); // always positive.. 
	if (velocityMagnitude > SHIP_SPEED) {  // cap the speed
		newVelocity = c3dl.multiplyVector(newVelocity, (1/velocityMagnitude)* (SHIP_SPEED) );
	}
	
	thisShip.setLinearVel( newVelocity );  
	shipVelocity = newVelocity;
	
	// move the asteroids and gold to give the illusion of speed
	for (var i = 0; i < asteroids.length; i++) {	
		// - check the asteroids intended velocity: asteroid.myLinearVel
		// - add the inverse of the ships velocity
		// - no need to cap magnitude, since we're not looking up actual velocity
		
		//var newAsteroidVelocity = addVectors( asteroids[i].myLinearVel, scaleVector(shipVelocity, -1));
		//thisAsteroid.setLinearVel(newAsteroidVelocity);
		 asteroids[i].setLinearVel( c3dl.addVectors( asteroids[i].getLinearVel(),c3dl.multiplyVector(shipVelocity, -1)));
	}

	// each prize
	for (var i = 0; i<prizes.length; i++) {
		
		// - check the asteroids intended velocity: asteroid.myLinearVel
		// - add the inverse of the ships velocity
		// - no need to cap magnitude, since we're not looking up actual velocity
		prizes[i].setLinearVel( c3dl.addVectors(prizes[i].getLinearVel(), c3dl.multiplyVector(shipVelocity, -3)));
	}

	// rotate the skybox to give illusion of speed.
	var skyBoxRotation = new Array( -direction[1], direction[0], 0); // kinda need this to rotate on global / world coordinates
	skyBoxRotation = c3dl.multiplyVector(skyBoxRotation, 0.01*velocityMagnitude);
	SkySphere_obj.setAngularVel(skyBoxRotation );
}

function turnRight(thisShip, speed)
{
	thisShip.setAngularVel( c3dl.multiplyVector( [0, -0.005, 0], speed ));
}

function turnLeft(thisShip, speed)
{
	thisShip.setAngularVel( c3dl.multiplyVector([0, 0.005, 0], speed) );
}

function moveFriendlyAIShips() {
	// should figure out where player 1 is in relation to them.. help them

	if (spaceShips.length > 1) { 
		for (var i=1; i < spaceShips.length; i++) { // move AI ships
		// spaceShip 0 is the player. All the other spaceShips are AI.
			var thisAIShip = spaceShips[i];
	
			// turn randomly
			thisAIShip.setAngularVel(new Array(0,Math.random()*0.01-0.005, 0 ) );	
			var direction = thisAIShip.getDirection();

			// go forward
			var diceRoll = Math.random();
			if (diceRoll > 0.7) { 
				goForward(thisAIShip);
			} else {
				//thisAIShip.setLinearVel(scaleVector(thisAIShip.getLinearVel(), DRAG));
			}
		}
	}
}

function regenerateField()
{
	numAsteroids = 5 + gameLevel;
	totaltime = 0; // reset the clock to allow for collision-free safety time
	lastScoreUpdateTime = 0;
	setupAsteroids(numAsteroids);
}

// *********************** Timers and Events ********************************
    
function keyPressHandler(keyboardEvent) {
	if (controlPrefs == "keyboard") {
		if (spaceShips.length == 0 ) return false; // can't maneuver what isn't there.
		
		var keyboardAutorepeatLag = 25;
		var code;
		if (keyboardEvent.which) { // mozilla on windows throws this (really quickly).. sometimes it keeps going after keyUp!!!!
			code = keyboardEvent.which;
			//printDebug("keyDownHandler: keyboardEvent.which = "+keyboardEvent.which);
		} else if ( keyboardEvent.keyCode) {
			code = keyboardEvent.keyCode;
			//printDsebug("keyDownHandler: keyboardEvent.keyCode = "+ keyboardEvent.keyCode);
		}
		
		//printDebug("totaltime: "+totaltime+" leftKey.timeLastLifted: "+leftKey.timeLastLifted);
		//printDebug("leftKey.status" + leftKey.status);
		
		if (code == leftKey.code && ( totaltime > leftKey.timeLastLifted + keyboardAutorepeatLag) ) {
			leftKey.status = "down";
			leftKey.timeLastPressed = totaltime;
		} else if (code == rightKey.code && ( totaltime > rightKey.timeLastLifted + keyboardAutorepeatLag) ) {
			rightKey.status = "down";
			rightKey.timeLastPressed = totaltime;
		} else if (code == upKey.code && ( totaltime > upKey.timeLastLifted + keyboardAutorepeatLag )) {
			upKey.status = "down";
			upKey.timeLastPressed = totaltime;
		} else if (code == shootKey.code && totaltime > shootKey.timeLastLifted + keyboardAutorepeatLag) {
			//shootKey.status = "down";
			//fireLasers(spaceShips[0]);
			shootKey.timeLastPressed = totaltime;
		}
	}
}

function keyUpHandler(keyboardEvent) {
	// key up handler has to set the status of the key AND say when it was issued.
	// this allows us to prevent keyboard autorepeat events from overriding the keyUp event.
	code = keyboardEvent.keyCode;
	if (controlPrefs == "keyboard") {
		if (code == leftKey.code) {
			leftKey.status = "up";
			leftKey.timeLastLifted = totaltime;
		} else if (code == rightKey.code) {
			rightKey.status = "up";
			rightKey.timeLastLifted = totaltime;
		} else if (code == upKey.code) {
			upKey.status = "up";
			upKey.timeLastLifted = totaltime;
		} else if (code == shootKey.code) {
			shootKey.status = "up";
			shootKey.timeLastLifted = totaltime;
			if (lasersOn) lasersOn = false;
			else if (!lasersOn) lasersOn = true;
		}
	}
}

function maneuverShip(thisShip) { // doesn't do anything right now.. would be nice to have for AI though

	// thisShip.setAngularVel(new Array(0,0,0)); // may want to reconsider this.. as long as angular velocity is reduced by drag.
	induceLinearDrag(thisShip);
	induceRotationalDrag(thisShip);

	if (controlPrefs == "mouse") {
		speed = Math.abs( (getDirectionToTarget(thisShip, new Array(mouseX, mouseY, depthOffset))) /10 );
		
		if (rotationDirection > 0) {
			turnRight(thisShip, speed);
		} else {
			turnLeft(thisShip, speed);
		}
		
		if (upKey.status == "down" && totaltime > upKey.timeLastLifted+upKey.lagTime) { // go forward
			goForward(thisShip);
		
		}
	} else if (controlPrefs == "keyboard") {
		speed = 1.0;
	
		if (leftKey.status == "down" &&  totaltime > leftKey.timeLastLifted + leftKey.lagTime ) { // turn left
			turnLeft(thisShip, speed);
		} else if (rightKey.status == "down" && totaltime > rightKey.timeLastLifted + rightKey.lagTime) { // turn right
			turnRight(thisShip, speed);
		}
		
		if (upKey.status == "down" && totaltime > upKey.timeLastLifted+upKey.lagTime) { // go forward

			goForward(thisShip);
			
		}
	}
}

function mouseUpCB(mouseEvent) {
	if (controlPrefs == "mouse") {
		upKey.status = "up";
		upKey.timeLastLifted = totaltime;
	}
}

function mouseDownCB(mouseEvent) {
	if (controlPrefs == "mouse") {	
		upKey.status = "down";
		upKey.timeLastPressed = totaltime;
	}
}

function mouseScrollCB(mouseEvent) {
}

function mouseMoveCB(event) {

 	if (controlPrefs == "mouse") {
		lastMouseUpdateTime = totaltime;

		
		var tempDiv = document.getElementsByTagName('canvas')[0];
		var coords = findPos(tempDiv);

		// determine the correct X, Y
		mouseX = ( ( event.clientX - coords[0] ) + window.pageXOffset )  - (tempDiv.width / 2.0);
		mouseY = (tempDiv.height / 2.0) - ( event.clientY - ( coords[1] - window.pageYOffset ) );
		
		//scale mouseX and mouseY to match x & y values at depth offset...
		// Note: this might not work at different screen resolutions, different displays, different browsers, who knows.
		mouseX /= (tempDiv.width/2.0);
		mouseX *= halfWidth;
		mouseY /= (tempDiv.height/2.0);
		mouseY *= halfHeight;

		
		if (totaltime > lastMouseUpdateTime + 250 || totaltime < lastMouseUpdateTime) {		
			printDebug("getXandY(mouseEvent) = "+mouseX+", "+mouseY);
		}
	}
}

function findPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj == obj.offsetParent);
		return [curleft,curtop];
	}
}

/*
  This callback function is used by the scene class.  Every time
	the scene is updated, it will get called.  This function tests
	the amount of time elapsed since the page was loaded             
*/
function frameHandler(time) 
{
	// totaltime stores amount of time passed since page was loaded.
	// time is in milliseconds. Thus 2000 millisecond is 2 seconds.
	totaltime = totaltime+time;   

	if (totaltime < 500) { // make sure things have initialized ok.
		return false;
	}

	// once per second: update score, move ai ships
	if (totaltime > lastScoreUpdateTime + 1000 || totaltime < lastScoreUpdateTime) { // do this once a second
		lastScoreUpdateTime = totaltime;
		controlPrefs = getControlPreferences();
	

	//		INSTRUCTIONS = "Use the arrow keys to turn and go forward.<br>Shoot asteroids and collect gold.";
	//		INSTRUCTIONS = "Use the mouse to orient your ship. Press the mouse button to move forward.<br>Shoot asteroids and collect gold.";
		
		if (score != lastScore) {
			updateScoreDisplay(score);
			lastScore = score;
		}
	
		// this is handled by startNextLevel, called from blowupAsteroid();
		/*if (asteroids.length < 1 && spaceShips.length > 0) { // congrats, you cleared a level!
			cleanup(); // cleanup is a drag because it removes the prizes.
			lastShot = 0;
			gameLevel +=1;
			regenerateField();
			spawnSingleSpaceship();
		}*/
	}

	if (totaltime > lastShot + 500 && lasersOn == true && spaceShips.length > 0) {
		fireLasers(spaceShips[0]);
		lastShot = totaltime;
		//printDebug("firing lasers");
	}
	
	if (numTicks % 5 == 0 ) { // every five frames.	
	// translate things across the screen boundaries	
		checkWallCollisions(spaceShips);
		checkWallCollisions(asteroids);
		checkWallCollisions(prizes);

		removeOffscreenLasers();

	}

	if (numTicks % 2 == 0) { // every even frame
		if (totaltime > 2000 && GOD_MODE == false) { // wait 2 seconds before you start testing collisions against the player
			//testTwoArraysForCollisions(lasers, spaceShips);
			testTwoArraysForCollisions(spaceShips, asteroids);
		}
	}

	if (numTicks % 2 == 1) { // every odd frame
		testTwoArraysForCollisions(spaceShips, prizes);
		removeOldExplosions();
	}	
	

	// every single frame
	// Move player ship and fire lasers.
	testTwoArraysForCollisions(lasers, asteroids);
	testTwoArraysForCollisions(lasers, prizes); 
			
	if (spaceShips.length > 0) { // player is currently alive
		
		maneuverShip(spaceShips[0]);

	} else if (spaceShips.length == 0 && livesRemaining > 0) { // player died but has some lives left
		// rotate the skybox fast to give illusion of crashing.
		// var skyBoxRotation = new Array( 0, 0.01, 0.009); // kinda need this to rotate on global / world coordinates
		//SkySphere_obj.setAngularVel(skyBoxRotation );
		// printDebug("player died at "+timeOfLastDeath+". Current time is: "+totaltime);
				
		// check to see if the player died (no ships left onscreen) and if they have lives remaining
		if (totaltime > timeOfLastDeath + 2500) { // wait a couple seconds, then we'll start your next life
			cleanup();
			regenerateField();
			spawnSingleShip();
		}
		
	} else { // player is DEAD.  GAME OVER
		//SkySphere_obj.setAngularVel([-0.00001, 0.0, 0.0]);
	}
	
	numTicks++;
}


// *********************** MAIN CALLBACK ********************************
// canvasName is the name of the canvas where the scene will show.
function canvasMain(canvasName) {

	clearDebugLog();
	//printDebug("Starting Game... Ready");
	initializeVariables();
	setupScene(canvasName);
 
 	if(scn.init(canvasName)) { // check that it was successful
 		setupAudio();
		setupSkybox();
		setupLights("ambient", 0.1);
		setupLights("diffuse", 1);
		setupLights("sun", 1);
		setupCamera();
		setupScoreboard("gameTable");

		// add the callback functions (events)
		scn.setUpdateCallback(frameHandler); // timer events
		//scn.setKeyboardCallback(keyUpHandler,keyDownHandler); //keypress events
		scn.setMouseCallback(mouseUpCB,mouseDownCB,mouseMoveCB,mouseScrollCB)
		document.addEventListener("keypress",keyPressHandler,false);
		//document.addEventListener("keydown",keyDownHandler,false);
		document.addEventListener("keyup",keyUpHandler,false);

		// start the scene
		scn.startScene();
		initGame(canvasName);
	}
}
