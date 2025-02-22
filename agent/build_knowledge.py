import os

working_dir = os.path.dirname(os.path.abspath(__file__))


def combine_files(file_list, output_file):
    with open(output_file, 'w') as outfile:

        for fname in file_list:
            if os.path.isfile(fname):
                outfile.write(
                    f"// {fname}\n")  # Write the filename as a comment
                with open(fname) as infile:
                    outfile.write(infile.read())
                    outfile.write("\n")  # Add a newline for separation
            else:
                print(f"File {fname} does not exist.")


if __name__ == "__main__":
    # List of files to combine
    files_to_combine = [
        "src/animation/animation.ts",
        "src/effects/coloring.ts",
        "src/effects/brightness.ts",
        "src/effects/motion.ts",
        "src/effects/types.ts",
        "src/time/time.ts",
        "src/objects/ring-elements.ts",
    ]

    output_filename = "combined_knowledge.ts"

    files_with_canonical_paths = [
        os.path.abspath(os.path.join(working_dir, "..", f))
        for f in files_to_combine
    ]
    combine_files(files_with_canonical_paths,
                  os.path.join(working_dir, output_filename))
