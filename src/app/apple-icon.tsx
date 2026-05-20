import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(180deg, #0c1019 0%, #090c14 42%, #06070d 100%)",
          color: "#eef3ff",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%"
        }}
      >
        <div
          style={{
            background: "radial-gradient(circle at top, rgba(38,92,255,0.45), rgba(38,92,255,0) 70%)",
            height: "100%",
            left: 0,
            position: "absolute",
            top: 0,
            width: "100%"
          }}
        />
        <div
          style={{
            alignItems: "center",
            border: "6px solid rgba(238,243,255,0.12)",
            borderRadius: 40,
            display: "flex",
            height: 104,
            justifyContent: "center",
            width: 104
          }}
        >
          <div
            style={{
              background: "#265cff",
              borderRadius: 9999,
              height: 40,
              width: 40
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.06em",
            marginTop: 12
          }}
        >
          ET
        </div>
      </div>
    ),
    size
  );
}
