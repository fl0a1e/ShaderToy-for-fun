// ---------------------------------------
// It's my first shader!
// 
// create 2D circle
// And I want to test something in this shader
// Including SSAA and gamma 
// just for fun
// ---------------------------------------

#define AA 2
#define INV_GAMMA 0.454545

#define OUTSIDECIRCLE 0.0f
#define INSIDECIRCLE 1.0f

float sdCircle(vec2 p, float r){
    return length(p)-r;
}


float map(vec2 uv) {
    float res = -1.0f;

    // distance between uv and O
    float r = 0.5*abs(sin(iTime))-0.2;
    res = (sdCircle(uv, r) >= 0.05 && sdCircle(uv, r) <= 0.1) ? OUTSIDECIRCLE : res;
    res = (sdCircle(uv, r) >= 0.001 && sdCircle(uv, r) <= 0.03) ? INSIDECIRCLE : res;

    return res;
}


vec3 shader(vec2 uv, float flag){
    // background
    vec3 col = vec3(.03, .03, .06);
    
    // circle
    if(flag == OUTSIDECIRCLE){
        col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    }

    if(flag == INSIDECIRCLE){
        col = 0.5 + 0.5*cos(sin(iTime)+uv.xyx+vec3(0,2,4));
        
    }
    return col;
}


vec3 render(vec2 uv){
    
    // 2D raymarching(I called so)
    float flag = map(uv);
    
    // shadering
    vec3 col = shader(uv, flag);
    
    // others
    if(uv.y <= .001 && uv.y >= .0){
        col = vec3(1,1,1);
    }
    if(uv.x <= .001 && uv.x >= .0){
        col = vec3(1,1,1);
    }
    if(sdCircle(uv, .001) <= .005){
        col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));
    }

    return col;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec3 col;
    
    // SSAA
    #if AA > 1
    for(int i = 0; i < AA; i++)
        for(int j = 0; j < AA; j++){
            vec2 offset = (vec2(i,j)/float(AA)) - 0.5;

            // SSAA:1 pixel->AA*AA pixels
            // move our coordinates to center
            // Normalized pixel coordinates (from 0 to 1)
            vec2 uv = ((fragCoord+offset)-0.5*iResolution.xy)/iResolution.x; // fix range of x axis
            
    #else
            vec2 uv = (fragCoord-0.5*iResolution.xy)/iResolution.x;
    #endif
            // ----------------------------------------------
            col = render(uv);
            
    
     #if AA>1 
        }
     #endif
   
    
    // gamma
    col = pow(col, vec3(INV_GAMMA));
    
    vec3 tot = col;
    
    // Output to screen
    fragColor = vec4(tot,1.0);
}