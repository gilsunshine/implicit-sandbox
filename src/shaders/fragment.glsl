precision mediump float;

uniform vec3 u_camera;
uniform vec3 u_resolution;
uniform sampler3D u_volume;
uniform vec3 u_crossSectionSize;
uniform float u_dt;
uniform float u_time;
uniform float u_isoValue;
uniform float u_alphaVal;
uniform float u_color;// <0.5 = normals, >=0.5 = shading
uniform float u_renderMode;// <0.5 = surface, >=0.5 = volume

varying vec3 v_hitPos;
varying vec3 v_hitPosWorldSpace;
varying vec3 v_cameraObjectSpace;

// Inigo Quilez color palette
vec3 palette(in float t){
    vec3 a=vec3(.5);
    vec3 b=vec3(.5);
    vec3 c=vec3(1.);
    vec3 d=vec3(0.,.33,.67);
    return a+b*cos(6.28318*(c*t+d));
}

vec2 intersect_box(vec3 orig,vec3 dir){
    vec3 box_min=vec3(-.5);
    vec3 box_max=vec3(.5);
    
    box_min+=max(u_crossSectionSize,vec3(0.));
    box_max+=min(u_crossSectionSize,vec3(0.));
    
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
    vec3 rayOrigin=v_cameraObjectSpace;
    vec3 rayDir=normalize(v_hitPos-rayOrigin);
    
    vec2 tHit=intersect_box(rayOrigin,rayDir);
    if(tHit.x>tHit.y)discard;
    tHit.x=max(tHit.x,0.);
    
    float dt=u_dt;
    vec4 color=vec4(0.);
    
    vec3 texBoxMin=vec3(0.);
    vec3 texBoxMax=vec3(1.);
    texBoxMin+=max(u_crossSectionSize,vec3(0.));
    texBoxMax+=min(u_crossSectionSize,vec3(0.));
    
    vec3 pos=rayOrigin+tHit.x*rayDir+.5;
    
    for(float t=tHit.x;t<tHit.y;t+=dt){
        float raw=texture(u_volume,pos).r;
        float sdf=raw;
        
        if(u_renderMode>.5){
            // Volume mode
            float alpha=smoothstep(0.,u_alphaVal,1.-abs(sdf));// near surface = more alpha
            vec3 col=palette((sdf+1.)/2.);
            vec4 sampleColor=vec4(col,alpha);
            color.rgb+=(1.-color.a)*sampleColor.a*sampleColor.rgb;
            color.a+=(1.-color.a)*sampleColor.a;
            if(color.a>=.95)break;
        }else{
            // Surface mode — SDF < isoValue means inside, crossing = surface
            if(sdf<u_isoValue){
                float epsilon=.001;
                if(
                    pos.x<texBoxMin.x+epsilon||pos.x>texBoxMax.x-epsilon||
                    pos.y<texBoxMin.y+epsilon||pos.y>texBoxMax.y-epsilon||
                    pos.z<texBoxMin.z+epsilon||pos.z>texBoxMax.z-epsilon
                ){
                    color=vec4(.85,1.,0.,1.);// edge coloring
                    break;
                }
                
                // Estimate normal in SDF space
                float sdf_dx=texture(u_volume,pos+vec3(u_dt,0,0)).r*2.-1.-
                (texture(u_volume,pos-vec3(u_dt,0,0)).r*2.-1.);
                float sdf_dy=texture(u_volume,pos+vec3(0,u_dt,0)).r*2.-1.-
                (texture(u_volume,pos-vec3(0,u_dt,0)).r*2.-1.);
                float sdf_dz=texture(u_volume,pos+vec3(0,0,u_dt)).r*2.-1.-
                (texture(u_volume,pos-vec3(0,0,u_dt)).r*2.-1.);
                vec3 normal=normalize(vec3(sdf_dx,sdf_dy,sdf_dz));
                
                if(u_color<.5){
                    color=vec4(normal*.5+.5,1.);
                }else{
                    vec3 lightDir=normalize(vec3(1.,1.,1.));
                    vec3 lightDir2=normalize(vec3(-1.,-1.,-1.));
                    float diffuse=max(dot(normal,lightDir),0.);
                    float diffuse2=max(dot(normal,lightDir2),0.);
                    float ambient=.3;
                    float shading=ambient+.4*diffuse+.4*diffuse2;
                    vec3 isoColor=palette((u_isoValue+1.)/2.);
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
