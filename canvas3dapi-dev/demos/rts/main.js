/*
  Copyright (c) 2008 Seneca College
  Licenced under the MIT License (http://www.c3dl.org/index.php/mit-license/)
*/

// model paths
const BARRACKS_PATH = "models/barracks.dae";
const PLANE = "models/cube.dae";
const FARM_PATH = "models/farm.dae";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

c3dl.addModel(BARRACKS_PATH);
c3dl.addModel(FARM_PATH);
c3dl.addModel(PLANE);

c3dl.addMainCallBack(canvasMain, 'rts');

var scn;
var test; 
var mx, my,mz;
var psys;
var cam;

var objectSelected = null;

// the material the selected object will have
var selectedMat = null;


function canvasMain(canvasName)
{
  scn = new c3dl.Scene();
  scn.setCanvasTag(canvasName);
  var renderer = new c3dl.WebGL();
  scn.setRenderer(renderer);
  scn.init();

  scn.setAmbientLight([1,1,1]);
  
  selectedMat = new c3dl.Effect();
  selectedMat.init(c3dl.effects.SEPIA);
  selectedMat.setParameter("color", [0.7, 0.2, 0.2]);

  var light = new c3dl.DirectionalLight();
  light.setDiffuse([0.3,0.4,0.3]);
  light.setDirection([1,-1,-1]);
  light.setSpecular([1,1,0]);
  light.setOn(true);
  scn.addLight(light);
  
  
  psys = new c3dl.ParticleSystem();
	psys.setMinVelocity([-1,15,-1]);
	psys.setMaxVelocity([1,25, 1]);
  
	psys.setMinLifetime(0.3);
	psys.setMaxLifetime(0.7);
  
	psys.setMinColor([0.4,0,0,0]);
	psys.setMaxColor([1,0.4,0,1]);
  
	psys.setSrcBlend(c3dl.ONE);
	psys.setDstBlend(c3dl.ONE);
  
  psys.setMinSize(0.2);
  psys.setMaxSize(0.5);
  
	psys.setTexture("textures/flare.gif");
	psys.setAcceleration([0,0,0]);
	psys.setEmitRate(80);
	psys.init(150);
  scn.addObjectToScene(psys);
  
  var earth = new c3dl.Collada();
  earth.init(PLANE);
  earth.setTexture("textures/grass.jpg");
  earth.scale([10,.01,10]);
  earth.id = 0;
  scn.addObjectToScene(earth);

  cam = new c3dl.FreeCamera();
  cam.setPosition([0,50,30.01]);
  cam.setLookAtPoint([0,0,-10]);

  scn.setCamera(cam);
  scn.startScene();
  scn.setKeyboardCallback(onKeyUp, onKeyDown);
	scn.setMouseCallback(m, null, mouseMove, s);
  scn.setUpdateCallback(update);
  scn.setPickingCallback(picking);
}

function onKeyUp(){}

function m()
{
  test = null;
}

function s(e)
{
  if(test)
  {
    test.roll(e.detail/20);
  }
}

function onKeyDown(event)
{}

function createObject(objID)
{
  var collada = new c3dl.Collada();

  switch(objID)
  {
    case 0:
        collada.init(BARRACKS_PATH);
        collada.pitch(-3.14/2);
        scn.addObjectToScene(collada);
        test = collada;
        break;
    case 1:
        collada.init(FARM_PATH);
        collada.pitch(-3.14/2);
        scn.addObjectToScene(collada);
        test = collada;
        break;
        
    default:break;
  }
}

function mouseMove(event)
{
  // get mouse coords relative to window
	var mmx = event.pageX - 1;//  - 250;
	var mmy = event.pageY - 1;// - 250;

  if(mmx != null && mmy !=null)
  {
  
  // NDC
  var normalizedDeviceCoords = [
      ( 2 * mmx / CANVAS_WIDTH) -1,
     -((2 * mmy / CANVAS_HEIGHT) -1),
      1,1];
  
//  mx = normalizedDeviceCoords[0];
//  my = normalizedDeviceCoords[1];
  
  // get clip coords
  var iproj = c3dl.inverseMatrix(scn.getProjectionMatrix());

		// To get the clip coords, we multiply the viewspace coordinates by
		// the projection matrix.
		// Working backwards across the pipeline, we have to take the normalized
		// device coordinates and multiply by the inverse projection matrix to get
		// the clip coordinates.
		var clipCoords = c3dl.multiplyMatrixByVector(iproj, normalizedDeviceCoords);
		
		// perspective divide
		clipCoords[0] /= clipCoords[3];
		clipCoords[1] /= clipCoords[3];
		clipCoords[2] /= clipCoords[3];
  
  clipCoords[2] = -clipCoords[2];
   
  var rayInitialPoint = cam.getPosition();
	
		var x = clipCoords[0];
		var y = clipCoords[1];
		var z = clipCoords[2];

		var kludge = c3dl.multiplyVector(cam.getLeft(), -1);
    
    
		var viewMatrix = c3dl.makePoseMatrix(kludge, cam.getUp(), cam.getDir(), cam.getPosition());

var rayTerminalPoint = c3dl.multiplyMatrixByVector(viewMatrix, [x,y,z,0]);
var rayDir = c3dl.normalizeVector(rayTerminalPoint);
  
  
//  		var rayorigin = c3dl.multiplyMatrixByVector(mat, rayOrigin);
	//	var raydir = c3dl.normalizeVector(c3dl.multiplyMatrixByDirection(mat, rayDir));


//  mx = rayTerminalPoint[0]/100;
 // my = -rayTerminalPoint[1]/200;
 // mz = rayTerminalPoint[2]/100;
  
  //var ccc = c3dl.normalizeVector(cam.getPosition());
  
  // get angle
  var angle = Math.acos( -1*rayDir[1] );
  var caml = rayInitialPoint[1]; //c3dl.vectorLength(rayInitialPoint);
  

  
  var hyp = caml/Math.cos(angle);
    mx = angle;// - rayInitialPoint[0];
  my = caml;
//  mz = hyp;
  
  mx = hyp * rayDir[0];
  my = hyp * rayDir[1];
  mz = hyp * rayDir[2];
      
 // mx = rayTerminalPoint[0] * 10;
  //rayDir[0] * 15;
//  my = rayTerminalPoint[1]* 10;
  //rayDir[1] * 15;
//  mz = rayTerminalPoint[2]* 10;
  //rayDir[2] * 15;  
// mx = hyp;


  /*
  planeNormal = [0,-1,0];
  pointOnPlane = [0,0,0];
  
  var d = - planeNormal[0]*rayInitialPoint[0] + planeNormal[1]*rayInitialPoint[1] + + planeNormal[2]*rayInitialPoint[2];

  //rayInitialPoint
//  var sc = c3dl.vectorLength(rayInitialPoint)
var sc =   d/(planeNormal[0]*rayDir[0] +planeNormal[1]*rayDir[1]+ planeNormal[2]*rayDir[2]);
  
  var intPoint = [
    rayInitialPoint[0] + rayDir[0] * sc,
    rayInitialPoint[1] + rayDir[1] * sc,
    rayInitialPoint[2] + rayDir[2] * sc
  ];
  */
  //mx = intPoint[0];
 // my = intPoint[1];
  //  mz = intPoint[2];
  // see where ray intersects with ground
 // var x = 0;
 // var z = 0;
  }
}

function update()
{
  document.getElementById("fps").innerHTML = "<br />FPS:" + Math.floor(scn.getFPS());
  document.getElementById("debug").innerHTML = mx + " " + my + " " + mz;
  
  if(mx && test)
  {
    test.setPosition([mx,0,mz]);
  }
}



function picking(pickingObj)
{
	var objectsHit = pickingObj.getObjects();

	if( objectsHit.length > 0 )
	{
		for( var i in objectsHit)
		{
      // If the ground was selected, the user just
      // wants to deselect the current selected object.
      if(objectsHit.length == 1)
      {
        objectSelected.setEffect(c3dl.effects.STANDARD);
        objectSelected = null;
        break;
      }      
      
      // If the object that was clicked isn't the ground
      if(objectsHit[i].id !== 0)
      {
        if(objectSelected)
        {
          objectSelected.setEffect(c3dl.effects.STANDARD);
        }
      
        objectsHit[i].setEffect(selectedMat);
        objectSelected = objectsHit[i];
        break;
      }
		}
	}
}
