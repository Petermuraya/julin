import { GetServerSideProps } from "next";

export default function Page() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string | undefined;
  return {
    redirect: {
      destination: slug ? `/blog/${encodeURIComponent(slug)}` : "/blogs",
      permanent: false,
    },
  };
};
