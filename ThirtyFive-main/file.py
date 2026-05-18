import tkinter as tk
from tkinter import filedialog
import os
import time

root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)

# Sélection multiple - TOUS les fichiers
file_paths = filedialog.askopenfilenames(
    title="Sélectionnez plusieurs fichiers",
    filetypes=[("Tous les fichiers", "*.*")]
)

if file_paths:
    target_file = "fusion.txt"
    
    # AJOUT À LA FIN PAR DÉFAUT (toujours mode 'a')
    with open(target_file, 'a', encoding='utf-8') as f_out:
        # Ajouter un séparateur si le fichier n'est pas vide
        if os.path.exists(target_file) and os.path.getsize(target_file) > 0:
            f_out.write("\n" + "="*50 + "\n")
            f_out.write(f"--- Nouvelle fusion AJOUTÉE le {time.strftime('%Y-%m-%d %H:%M:%S')} ---\n")
            f_out.write("="*50 + "\n\n")
        
        for i, file_path in enumerate(file_paths):
            # Lecture du fichier avec gestion des erreurs d'encodage
            try:
                with open(file_path, 'r', encoding='utf-8') as f_in:
                    content = f_in.read()
            except UnicodeDecodeError:
                try:
                    with open(file_path, 'r', encoding='latin-1') as f_in:
                        content = f_in.read()
                except:
                    content = "[ERREUR: Impossible de lire ce fichier (peut-être binaire)]"
            
            # Séparateur entre les fichiers
            if i > 0:
                f_out.write("\n" + "-"*50 + "\n\n")
            
            f_out.write(f"Fichier : {os.path.basename(file_path)}\n")
            f_out.write(f"Chemin  : {file_path}\n\n")
            f_out.write(content)
            f_out.write("\n")
    
    print(f"✓ {len(file_paths)} fichier(s) AJOUTÉ(S) à la fin de '{target_file}'")
else:
    print("Aucun fichier sélectionné.")