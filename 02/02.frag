// ----------------------------------------------------
// my 2nd shader!
// I'll create a 3D sphere in this shader
// and i'll use a simple light shading on the surface.
// refer to iq!
// 
// you can learn more in below project:
// https://www.shadertoy.com/view/Xl2XWt
//
// or
// https://www.shadertoy.com/view/Xds3zN
//
// about texture
// https://www.shadertoy.com/view/sdj3Rc
//
// how amazing the raymarching is!
// -----------------------------------------------------


// PI
// SSAA
// GAMMA
// focal length
#define PI 3.1415926
#define AA 2
#define INV_GAMMA 0.454545
#define FOCAL  3.5f      

// p is the point in 3D world
float sdSphere(in vec3 p, in float r){
    return length(p)-r;
}


// return minimum distance to surface
float map(in vec3 pos){
    float res = sdSphere( pos-vec3(0.0, 0.0, 0.0), 0.1);
    return res;
}



// return distance to surface of each ray
float raycast(in vec3 cameraPos, in vec3 rayDir) {
    float res = -1.0;
    
    // minimum and maximum distance ray traveled
    float minDist =1.0;
    float maxDist = 30.0;
    
    // raymarching
    float dist = minDist;
    for(int i = 0; i < 40 && dist < maxDist; i++) {   // "i" means the frequency of sphere tracking.
    
        float temp = map(cameraPos + rayDir * dist);
        if( abs(temp) < 0.0001 ) {    // if close enough to the surface
            res = dist;
            break;
        }
        dist += temp; // Sphere Tracking, so we need to add minimum distance to Surface for speed up function.
    }
    return res;
}


// light shader need normal.
// calculate normal by using gradient.
// but here I use the function from iq
// https://www.shadertoy.com/view/Xds3zN
// inspired by tdhooper and klems - a way to prevent the compiler from inlining map() 4 times
vec3 calcNormal(in vec3 pos){
    vec3 n = vec3(0.0);
    for( int i=0; i<4; i++ )
    {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*map(pos+0.0005*e);
      
    }
    return normalize(n);
}


vec3 render(in vec3 cameraPos, in vec3 rayDir, in vec2 uv) {
    
    vec3 col;
    
    // raycast scene(raymarching!)
    float res = raycast(cameraPos, rayDir);
    
    // render sphere
    if(res > 0.){
        
        vec3 pos = cameraPos + rayDir * res;
        vec3 nor = calcNormal(pos);    // normal
        
        // blinn phong
        {
        vec3 sunPos = vec3(15.0 * cos(iTime), 15.0, 10.0 * sin(iTime));
        
        
        // texture    
        vec2 polarUV = vec2(atan(pos.x*800., pos.z*450.)/PI, 4.*pos.y);
        vec3 t = texture(iChannel0, polarUV).rgb;
        
        
        vec3 ambientColor = 2.* t;
        vec3 diffuseColor = 2.* t;
        vec3 specColor = vec3(0.5, 0.5, 0.5);
        vec3 lightColor = vec3(1.0, 1.0, 1.0);
        vec3 lightDir =  normalize(sunPos - pos);
        float lambertian = max(dot(lightDir, nor), 0.0);
        float shininess = 16.0;
        float specular = 0.0;
        float lightPower = 15.0;
        
        
        vec3 halfDir = normalize(lightDir - rayDir);
        float specAngle = max(dot(halfDir, nor), 0.0);
        specular = pow(specAngle, shininess);
        
        
        col = ambientColor +
              diffuseColor * lambertian * lightColor * lightPower / length(sunPos - pos)*length(sunPos - pos) +
              specColor * specular * lightColor * lightPower / length(sunPos - pos)*length(sunPos - pos);
        }
        
    } else {
        // background
        col = vec3(0.01);
    }
    return col;
}



// create our camera!
// each parameter means:ray origin, target and camera rotation
// 
// I think that it's so-called "billboard". 
// we can calculate the coordinates centered on our camera.
mat3 setCamera(in vec3 ro, in vec3 ta, in float cr) {
    vec3 cw = normalize(ta - ro); // the direction our camera watched
    // calculate the x&y-axis centered on camera.
    vec3 cu= normalize( cross(cw,vec3(sin(cr),cos(cr),0.0) ) );
    vec3 cv=          ( cross( cu, cw ) );  

    return mat3(cu, cv, cw);
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 tot;
    
    // init camera
    // Attention, z-axis points out of the screen!
    vec3 cameraPos = vec3(3.*sin(iTime), 0.5, 3.0*cos(iTime));
    // camera orientation
    vec3 cameraOrit = vec3(0., 0., 0.2);
    // create camera
    // camera-to-world transformation
    mat3 camera = setCamera(cameraPos, cameraOrit, 0.);
    
    // SSAA
    // get uv for each pixel
    #if AA > 1
    for(int i = 0; i < AA; i++)
    for(int j = 0; j < AA; j++){
        
        vec2 offset = (vec2(i,j)/float(AA)) - 0.5;
        vec2 uv = ((fragCoord+offset)-0.5*iResolution.xy)/iResolution.x;
    
    #else 
        vec2 uv = (fragCoord-0.5*iResolution.xy)/iResolution.x;
    #endif
        
        // ray direction
        vec3 rayDir = camera * normalize( vec3(uv,FOCAL) );
        
        // render our world
        // return color of each pixel
        vec3 col = render(cameraPos, rayDir, uv);
        
        // gamma
        col = pow( col, vec3(INV_GAMMA) );
        
        tot += col;
        
    
    #if AA > 1
        tot /= float(AA*AA);
    }
    #endif
    
    
    // Output to screen
    fragColor = vec4(tot,1.0);
}