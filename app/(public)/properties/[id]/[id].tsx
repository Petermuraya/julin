import { GetServerSideProps } from "next";

export default function Page() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string | undefined;
  return {
    redirect: {
      destination: id ? `/property/${encodeURIComponent(id)}` : "/properties",
      permanent: false,
    },
  };
};
