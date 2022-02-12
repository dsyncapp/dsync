import * as video_manager from "../video-managers";
import * as Next from "@nextui-org/react";
import * as React from "react";

import VideoSource from "./video-source";

type Props = video_manager.VideoManagerHooks;

export const ManualSource = React.forwardRef<video_manager.VideoManager, Props>((props, ref) => {
  const file_input = React.useRef<HTMLInputElement | null>(null);
  const [file_url, setFileUrl] = React.useState<string>();

  const loadVideo = (file: File) => {
    const file_url = URL.createObjectURL(file);
    setFileUrl(file_url);
  };

  return (
    <>
      {file_url ? (
        <VideoSource {...props} ref={ref} url={file_url} />
      ) : (
        <Next.Button
          onClick={() => {
            file_input.current?.click();
          }}
        >
          Load Video
        </Next.Button>
      )}

      <input
        type="file"
        ref={file_input}
        accept="video/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) {
            loadVideo(e.target.files[0]);
          }
        }}
      />
    </>
  );
});

export default ManualSource;
