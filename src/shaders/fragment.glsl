precision mediump float;

uniform vec3 u_camera;
uniform vec3 u_resolution;
uniform sampler3D u_volume;
uniform vec3 u_crossSectionSize;
uniform float u_dt;
uniform float u_time;
uniform float u_isoValue;
uniform float u_alphaVal;
uniform float u_color;// Toggle: <0.5 = normals; >=0.5 = Phong shading
uniform float u_renderMode;

varying vec3 v_hitPos;
varying vec3 v_hitPosWorldSpace;
varying vec3 v_cameraObjectSpace;

// Color palette function (Inigo Quilez)
vec3 palette(in float t){
    vec3 a=vec3(.5);
    vec3 b=vec3(.5);
    vec3 c=vec3(1.);
    vec3 d=vec3(0.,.33,.67);
    return a+b*cos(6.28318*(c*t+d));
}

// Intersect a ray with a box defined by [-u_crossSectionSize, u_crossSectionSize]
vec2 intersect_box(vec3 orig,vec3 dir){
    vec3 box_min=-u_crossSectionSize;
    vec3 box_max=u_crossSectionSize;
    vec3 inv_dir=1./dir;
    vec3 t0s=(box_min-orig)*inv_dir;
    vec3 t1s=(box_max-orig)*inv_dir;
    vec3 tmin=min(t0s,t1s);
    vec3 tmax=max(t0s,t1s);
    float tNear=max(max(tmin.x,tmin.y),tmin.z);
    float tFar=min(min(tmax.x,tmax.y),tmax.z);
    return vec2(tNear,tFar);
}

void main(){
    // Setup ray origin and direction in object space.
    vec3 rayOrigin=v_cameraObjectSpace;
    vec3 rayDir=normalize(v_hitPos-rayOrigin);
    
    // Compute intersection of ray with volume bounds.
    vec2 tHit=intersect_box(rayOrigin,rayDir);
    if(tHit.x>tHit.y)discard;
    tHit.x=max(tHit.x,0.);
    
    float dt=u_dt;
    vec4 color=vec4(0.);
    
    // Compute texture-space boundaries based on the variable cross-section.
    vec3 texBoxMin=.5-u_crossSectionSize;
    vec3 texBoxMax=.5+u_crossSectionSize;
    
    // Convert the starting point to texture coordinates.
    vec3 pos=rayOrigin+tHit.x*rayDir+.5;
    
    // Ray marching loop.
    for(float t=tHit.x;t<tHit.y;t+=dt){
        float volValue=texture(u_volume,pos).r;
        float alpha=smoothstep(0.,u_alphaVal,volValue*.1);
        vec3 col=palette(volValue);
        vec4 sampleColor=vec4(col,alpha);
        
        // // Front-to-back compositing.
        // color.rgb+=(1.-color.a)*sampleColor.a*sampleColor.rgb;
        // color.a+=(1.-color.a)*sampleColor.a;
        
        // When the iso-value is exceeded, render the surface.
        
        if(u_renderMode>.5){
            // Volume rendering (translucent fog style)
            float alpha=smoothstep(0.,u_alphaVal,volValue*.1);
            vec3 col=palette(volValue);
            vec4 sampleColor=vec4(col,alpha);
            color.rgb+=(1.-color.a)*sampleColor.a*sampleColor.rgb;
            color.a+=(1.-color.a)*sampleColor.a;
            
            if(color.a>=.95)break;
        }else{
            if(volValue>u_isoValue){
                float epsilon=.001;
                // Check if the current position is near any boundary of the cross section.
                if(pos.x<texBoxMin.x+epsilon||pos.x>texBoxMax.x-epsilon||
                    pos.y<texBoxMin.y+epsilon||pos.y>texBoxMax.y-epsilon||
                pos.z<texBoxMin.z+epsilon||pos.z>texBoxMax.z-epsilon){
                    // Render a single color (red) if at the boundary.
                    color=vec4(0.,1.,.8157,1.);
                    break;
                }
                
                // Compute gradient using central differences.
                
                float dx=texture(u_volume,pos+vec3(u_dt,0.,0.)).r-
                texture(u_volume,pos-vec3(u_dt,0.,0.)).r;
                float dy=texture(u_volume,pos+vec3(0.,u_dt,0.)).r-
                texture(u_volume,pos-vec3(0.,u_dt,0.)).r;
                float dz=texture(u_volume,pos+vec3(0.,0.,u_dt)).r-
                texture(u_volume,pos-vec3(0.,0.,u_dt)).r;
                vec3 normal=normalize(vec3(dx,dy,dz));
                
                if(u_color<.5){
                    // Toggle: render the normals (remapped to [0,1]).
                    color=vec4(normal*.5+.5,1.);
                }else{
                    // Toggle: apply simple Phong shading.
                    vec3 lightDir2=normalize(vec3(-1.,-1.,-1.));
                    vec3 lightDir=normalize(vec3(1.,1.,1.));
                    float diffuse=max(dot(normal,lightDir),0.);
                    float diffuse2=max(dot(normal,lightDir2),0.);
                    float ambient=.3;
                    float shading=ambient+.4*diffuse+ambient+.4*diffuse2;
                    vec3 isoColor=palette(u_isoValue);
                    color=vec4(isoColor*shading,1.);
                }
                break;
            }
        }
        pos+=rayDir*dt;
        if(color.a>=.95)break;
    }
    
    gl_FragColor=color;
}
