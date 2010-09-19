/*
  Copyright (c) 2008 Seneca College
  Licenced under the MIT License (http://www.c3dl.org/index.php/mit-license/)
*/

/**
 @private
 Find the smallest number that's a power of 2 that's bigger
 than the given number.
 
 @param {int} number The base number which the next power of two 
 number must be found.  For example:
 <pre>
 var i = roundUpToNextPowerOfTwo(3);
 // i is now 4
 
 i = roundUpToNextPowerOfTwo(4);
 // i is now 4
 
 i = roundUpToNextPowerOfTwo(9);
 // i is now 16
 </pre>
 
 @returns {int} A number which is greater or equal to 'number'
 which is the closest power of two which exists.
 */
c3dl.roundUpToNextPowerOfTwo = function (number)
{
  var i = 1;

  while (i < number)
  {
    i *= 2;
  }

  return i;
}

/**
 Inverse of a square root.
 
 @param {float} num
 
 @return {float} the inverse square root of num or 0 ir num was not a 
 number.
 */
c3dl.invSqrt = function (num)
{
  if (!isNaN(num))
  {
    // We have to do this ourselves since javascript does not have it.
    return 1 / Math.sqrt(num);
  }

  c3dl.debug.logWarning('invSqrt() caled with a parameter that\'s not a number');

  return 0;
}

/**
 gluLookAt Implementation
 
 @param {Array} eye The location of the camera.
 @param {Array} center Where the camera is looking at.
 @param {Array} up A Vector which represents the camera's up
 vector.
 
 @returns {Array} the lookat matrix or null if one of the arguments were
 not valid Vectors.
 */
c3dl.lookAt = function (eye, center, up)
{
  // Figure out the orientation
  var z = c3dl.subtractVectors(eye, center, null);
  var x = c3dl.vectorCrossProduct(up, z, null);
  var y = c3dl.vectorCrossProduct(z, x, null);
  c3dl.normalizeVector(z);
  c3dl.normalizeVector(y);
  c3dl.normalizeVector(x);

  // makeMatrix expects values to be in column-major
  return c3dl.makeMatrix(x[0], y[0], z[0], 0, 
                         x[1], y[1], z[1], 0, 
                         x[2], y[2], z[2], 0, 
                         0,    0,    0,    1);
}

/**
 @private
 this function needs testing
 
 Create an orthographic matrix from the specified arguments.
 
 @param {float} left The coordinate of the left vertical clipping plane.
 @param {float} right The coordinate of the right vertical clipping plane.
 @param {float} bottom The coordinate of the bottom horizontal clipping 
 plane.
 @param {float} top The coordinate of the top horizontal clipping plane.
 @param {float} znear The distance to the near clipping plane.
 @param {float} zfar The distance to the far clipping plane.
 
 @returns {Array} an orthographic matrix defined by the arguments.
 */
c3dl.makeOrtho = function (left, right, bottom, top, znear, zfar)
{
  return M4x4.makeOrtho(left, right, bottom, top, znear, zfar);
}

/**
 Create a perspective projection matrix.
 
 @param {float} fovy The field of view angle in degrees in the Y 
 direction.
 @param {float} aspect The aspect ratio
 @param {float} znear The distance from the viewer to the near clipping
 plane.
 @param {float} zfar The distance from the viewer to the far clipping 
 plane.
 
 @returns {Array} A perspective projection matrix. 
 */
c3dl.makePerspective = function (fovy, aspect, znear, zfar)
{
  return M4x4.makePerspective(fovy, aspect, znear, zfar);
}

/**
 glFrustum Implementation
 
 @param {float} left The coordinate of the left vertical clipping plane.
 @param {float} right The coordinate of the right vertical clipping plane.
 @param {float} bottom The coordinate of the bottom horizontal clipping 
 plane.
 @param {float} top The coordinate of the top horizontal clipping plane.
 @param {float} znear The distance to the near clipping plane.
 @param {float} zfar The distance to the far clipping plane.
 
 @returns {Array} A perspective projection matrix.
 */
c3dl.makeFrustum = function (left, right, bottom, top, znear, zfar)
{
  return M4x4.makeFrustum(left, right, bottom, top, znear, zfar);
}

/**
 Convert 'rad' radians into degrees.
 
 @param {float} rad The value in radians to convert into degrees.
 
 @returns {float} The value of 'rad' radians converted to degrees.
 */
c3dl.radiansToDegrees = function (rad)
{
  return rad / (Math.PI * 2) * 360.0;
}

/**
 Convert 'deg' degrees into radians.
 
 @param {float} degrees The value in degrees to convert into radians.
 
 @returns {float} The value of 'deg' degrees converted to radians.
 */
c3dl.degreesToRadians = function (deg)
{
  return deg / 360.0 * (Math.PI * 2);
}

/**	
 Get a random value from min to max inclusive
 
 @param {num} min
 @param {num} max
 
 @returns {num} a random number from min to max.
 */
c3dl.getRandom = function (min, max)
{
  var norm = Math.random();
  return ((max - min) * norm) + min;
}

/**
  Find the greatest value in an array. This function is O(n).
  
  @param {Array} arrayIn
  
  @returns the greatest value in an array
*/
c3dl.findMax = function (arrayIn)
{
  var max = arrayIn[0];
  for (var i = 0; i < arrayIn.length; i++) {
    if (arrayIn[i] > max) {
      max = arrayIn[i];
    }
  }
  return max;
};

/**
  Find the smallest value in an array. This function is O(n).
  
  @param {Array} arrayIn
  
  @returns the smallest value in an array
*/
c3dl.findMin = function (arrayIn)
{
  var min = arrayIn[0];
  for (var i = 0; i < arrayIn.length; i++) {
    if (arrayIn[i] < min) {
      min = arrayIn[i];
    }
  }
  return min;
};

/**
 Does the given ray intersect the sphere? When using this function to test
 the ray created by a user click against a boundingsphere, keep the following
 in mind:  When trying to pick the bounding sphere the test will fail if a few
 pixels from the edges of the sphere.  Either it will seem that the test is passing
 when it should not or the test is failing when it should should pass.
 
 This could be because the 'pixel point' associated with the cursor is not at the
 very tip of the cursor where it is expected it to be.  This occurs on osx.
 
 @param {Array} rayInitialPoint The initial point of the ray in world space.
 @param {Array} rayDir A normalized vector which has the ray's direction.
 @param {Array} spherePos position of the sphere.
 @param {float} sphereRadius radius of the sphere.
 
 @returns {boolean} true if the given ray intersects the boundingsphere, otherwise false.
 */
c3dl.rayIntersectsSphere = function (rayInitialPoint, rayD, spherePos, sphereRadius)
{
  // this will hold the result if there was an intersection.
  var hasIntersected = false;

  var rayDir = c3dl.normalizeVector(rayD);

  var v = c3dl.subtractVectors(rayInitialPoint, spherePos);
  var a = c3dl.vectorDotProduct(rayDir,rayDir)
  var b = 2.0 * c3dl.vectorDotProduct(v, rayDir);
  var c = c3dl.vectorDotProduct(v, v) - (sphereRadius * sphereRadius);

  var discriminant = (b * b) - (4.0 * a * c);

  // these will hold the intersection values.
  var q;

  // If the discriminant is less than 0, we cannot get the square root
  // since it would result in an imaginary number.	
  if (discriminant >= 0)
  {	
    var discriminantsqrt = Math.sqrt(discriminant);
    if (b < 0) {
       q = (-b - discriminantsqrt) / 2;
    }
    else {
      q = (-b + discriminantsqrt) / 2;
    }
    
    var t0 = q / a;
    var t1 = c / q;
    
    // make sure t0 is smaller than t1
    if (t0 > t1)
    {
      // if t0 is bigger than t1 swap them around
      var temp = t0;
      t0 = t1;
      t1 = temp;
    }
    if (t1 < 0) {
      return false;
    }
    if (t1 > 0 || t0 > 0) {
      hasIntersected = true;
	  }
  }
  return hasIntersected;
}

/**
 Test if a ray defined by point 'orig' and direction 'dir' intersects with
 triangle defined by vertices vert0, vert1 and vert2.
 
 @param {Array} orig The ray's origin, which is a vector of 3 values.
 @param {Array} dir The ray's direction, a vector of 3 values.
 @param {Array} vert0 Vertex 0 of the triangle, going counter-clockwise.
 @param {Array} vert1 Vertex1 of the triangle
 @param {Array} vert2 Vertex2 of the triangle
 
 @returns {boolean} true if ray intersects with triangle, false otherwise.
 
 @private
 */
c3dl.rayIntersectsTriangle = function (orig, dir, vert0, vert1, vert2)
{
  // find vectors for the two edges of the triangle which share vert0
  var edge1 = c3dl.subtractVectors(vert1, vert0);
  var edge2 = c3dl.subtractVectors(vert2, vert0);

  // to calculate the area of the triangle:
  // first calculate the area of the parallelogram the two vectors define, 
  // then take half of that result leaving us with the area of the triangle.
  var area = 0.5 * c3dl.vectorLength(c3dl.vectorCrossProduct(edge1, edge2));

  // we'll need the normal of the triangle
  var norm = c3dl.vectorCrossProduct(edge1, edge2);

  // calculate this first to see if we can stop processing.
  var normDotDir = c3dl.vectorDotProduct(norm, dir);

  // if the dot product of two vectors returns 0, that means the vectors are perpendicular. If
  // that is the case, the ray will never intersect the plane and we can return false right here
  // to prevent further processing.
  if (normDotDir == 0)
  {
    return false;
  }

  // If the ray is not parallel to the plane, we need to do the following:
  // 1) find out at what point the ray will intersect the plane (which is defined by the triangle).
  // 2) find out if that point is within the triangle if it is, we have a ray/triangle intersection.
  // The parametric equation of a ray is:
  // R(t) = p + tu
  // where,
  // p is a point, which is the origin of the ray.
  // u is a vector, which is the direction of the ray. 
  // t is a scalar value, which scales the direction of the ray.
  // by passing in values greater than 0 into the equation, we can generate
  // different points along the ray.
  // The equation of a plane is:
  // Ax + By + Cz = D
  // where,
  // (ABC) is the normal of the plane.
  // (xyz) is a point on the plane.
  // we can re-write the equation for a plane
  // n . x = d
  // n is the normal of the plane.
  // x is a point on the plane.
  // So, with the equation of the plane and the ray, we can now
  // substitute the ray equation into the plane equation. What this does
  // is it tells us what value we need we have to set 't' to in order for
  // the ray to intersect the plane, which gives us the point of 
  // intersection. Or, what scalar value must we multiply the direction 
  // of the ray for it to intersect with the ray?
  // we substite R into the plane equation
  // n . R(t) = d
  // R(t) is expanded...
  // n . [p+tu] = d
  // distribute n
  // n.p + tn . u = d
  // We isolate t because we need to find out what scalar value the direction
  // of the ray needs to be scaled by for it to intersect with the plane.
  // t = (d - n.p) / (n.dir)
  //
  var d = c3dl.vectorDotProduct(norm, vert1);
  var normDotRayorig = c3dl.vectorDotProduct(norm, orig);
  var t = (d - normDotRayorig) / normDotDir;

  // Now we have 't', which is the scalar value needed to scale the ray's direction
  // for it to intersect with the plane the triangle defines.
  // We scale the ray's direction 't' times and then add it to the ray's origin to
  // get the point of intersection, POI.
  var scaledDir = c3dl.multiplyVector(dir, t);
  var POI = c3dl.addVectors(orig, scaledDir);

  // area of smaller triangles formed by the 3 vertices and the point of intersection	
  edge1 = c3dl.subtractVectors(vert0, POI);
  edge2 = c3dl.subtractVectors(vert1, POI);
  var edge3 = c3dl.subtractVectors(vert2, POI);

  // get the area of the three triangles 'created' where the 
  // ray intersects the triangle's plane. 
  var area1 = 0.5 * c3dl.vectorLength(c3dl.vectorCrossProduct(edge1, edge2));
  var area2 = 0.5 * c3dl.vectorLength(c3dl.vectorCrossProduct(edge2, edge3));
  var area3 = 0.5 * c3dl.vectorLength(c3dl.vectorCrossProduct(edge3, edge1));

  // get the difference between the area of the triangle and the area of the three triangles
  // created where the user clicked. If the user clicked inside the triangle, the difference
  // should be near zero.
  var diff = area - (area1 + area2 + area3);

  // delete edg1, edge2, edge3, area1, area2, area3, normDotDir, normDotRayorig, t, POI, area;
  // since we have done quite a few calculations on floats, 
  // allow a small margin of error.
  return (Math.abs(diff) <= 0.0001);
}
