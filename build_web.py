"""
Script for å bygge spillet for web med pygbag.
Kjør: python build_web.py
"""

import subprocess
import sys
import os

def build_web():
    """Bygger spillet for web."""
    print("Bygger spillet for web...")
    
    try:
        # Sjekk om pygbag er installert
        import pygbag
    except ImportError:
        print("pygbag er ikke installert. Installerer...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pygbag"])
    
    # Bygg spillet
    print("Kompilerer til WebAssembly...")
    print("Dette kan ta noen minutter...")
    
    result = subprocess.run(
        [sys.executable, "-m", "pygbag", "--template", "default", "main.py"],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print("\n✅ Bygging fullført!")
        print("📁 Filer ligger i 'build/web/' mappen")
        print("\nFor å publisere:")
        print("1. Last opp hele 'build/web/' mappen til din web-server")
        print("2. Eller bruk GitHub Pages, Netlify, Vercel, etc.")
        print("\n💡 Tips: For GitHub Pages, last opp til 'docs/' mappen i repoet ditt")
    else:
        print("\n❌ Feil under bygging:")
        print(result.stdout)
        print(result.stderr)
        print("\n💡 Prøv å kjøre manuelt: python -m pygbag main.py")
        return False
    
    return True

if __name__ == "__main__":
    build_web()

