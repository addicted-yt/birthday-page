import { ImageResponse } from "next/og";

export const alt = "Happy Birthday";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  searchParams,
}: {
  searchParams: Promise<{ d?: string; name?: string }>;
}) {
  const params = await searchParams;
  const safeDecode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  let name = "你";
  if (params.name) {
    name = safeDecode(params.name);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 35%, #0d1533 0%, #050810 65%, #020408 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "15%",
            left: "20%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(80,100,200,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "18%",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(120,80,180,0.06) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 300,
              letterSpacing: "0.55em",
              color: "rgba(255,255,255,0.28)",
              fontFamily: "sans-serif",
            }}
          >
            HAPPY BIRTHDAY
          </div>

          <div
            style={{
              fontSize: "120px",
              fontWeight: 200,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.94)",
              fontFamily: "sans-serif",
              lineHeight: 1,
            }}
          >
            {name}
          </div>

          <div
            style={{
              width: "48px",
              height: "1px",
              background: "rgba(255,255,255,0.15)",
            }}
          />

          <div
            style={{
              fontSize: "18px",
              fontWeight: 300,
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.32)",
              fontFamily: "sans-serif",
            }}
          >
            Today is your day
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            fontSize: "11px",
            letterSpacing: "0.3em",
            color: "rgba(255,255,255,0.12)",
            fontFamily: "sans-serif",
          }}
        >
          crafted by yt
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
