import subprocess,re,json,sys
from scripts import N
def weight(txt):
    w=0
    for ch in txt:
        if ch.isalnum(): w+=1
        elif ch in '.?!': w+=7
        elif ch in ',:;–': w+=3.5
    # Zahlen werden ausgesprochen
    w+=10*len(re.findall(r'\d{4}',txt))
    return w
def cuts(k):
    f=f'audio/{k}.mp3'
    dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
    r=subprocess.run(['ffmpeg','-i',f,'-af','silencedetect=noise=-32dB:d=0.03','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',r)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',r)]
    sil=[(s,e) for s,e in zip(st,en)]
    lead=sil[0][1] if sil and sil[0][0]<0.05 else 0
    tail=sil[-1][0] if sil and sil[-1][1]>dur-0.05 else dur
    paras=N[k].split('\n\n'); ws=[weight(p) for p in paras]; tot=sum(ws); acc=0; out=[0]
    for p,w in zip(paras[:-1],ws[:-1]):
        acc+=w; est=lead+(tail-lead)*acc/tot
        cand=[(s,e) for s,e in sil if abs((s+e)/2-est)<1.6 and s>0.2]
        if cand:
            s,e=max(cand,key=lambda x:(x[1]-x[0])-0.25*abs((x[0]+x[1])/2-est))
            out.append(round((s+e)/2,2))
        else: out.append(round(est,2))
    out.append(round(dur,2)); return out
if __name__=='__main__':
    for k in N: print(k,cuts(k))
